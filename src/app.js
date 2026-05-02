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
      // SUNO MP3がある曲はFileBGMで再生
      const suno = SUNO_BGM[trackName];
      if (suno) {
        // FileBGM._audio が消えていたら「再生中」と見なさず再生し直す
        if (trackName === BGM._current && BGM._playing && FileBGM._audio) return;
        BGM.stop();
        FileBGM.play(suno.file, { loop: true, volume: suno.vol });
        // FileBGM.play()内部でBGM.stop()が呼ばれるため、状態セットはその後に行う
        BGM._playing = true;
        BGM._current = trackName;
        return;
      }
      // フォールバック: チップチューン
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
      // タイトル戴冠: MP3ファイル版を使用（bgmMuted無視で必ず再生）
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
        if (G.pendingEvent && G.pendingEvent.type === 'war') {
          const warSrc = '../bgm/MusMus-BGM-125.mp3';
          if (FileBGM._audio && FileBGM._audio.src && FileBGM._audio.src.indexOf('MusMus-BGM-125') >= 0) return;
          FileBGM.play(warSrc, { loop: true, volume: 0.10 });
          return;
        }
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
    // ── 派閥イベント演出用: ワンショット stinger（BGM に触れない） ──
    // SE マスターボリューム適用、全体 mute 時は無音
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

// ╔══════════════════════════════════════════════════════════╗
// ║  FACTION EVENT AUDIO MAP (v6 §2-1)                       ║
// ║  handoff-v6 の BGM/stinger 登録表をデータ化              ║
// ╚══════════════════════════════════════════════════════════╝
const FACTION_AUDIO = {
  SOFT:    '../bgm/Soft Bids, Sharp Minds.mp3',
  TENSION: '../bgm/bgm_tension_v1.mp3',
  GONG:    '../bgm/f07_gong_v1.mp3',
  CHIME:   '../bgm/f06_fin_chime_v1.mp3',
};
// 各イベントの { src, volume, openStinger?, closeStinger? }
// closeStinger は結果モーダルの「閉じる」クリック時に fadeOut 直前で再生
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
  // §2-3 v7 確定（faction-events.md §音響設計 表拡張に準拠）
  F05:            { src: FACTION_AUDIO.SOFT,    volume: 0.14 },
  F06:            { src: FACTION_AUDIO.SOFT,    volume: 0.16,                                           closeStinger: { src: FACTION_AUDIO.CHIME, volume: 0.10 } },
  F07:            { src: FACTION_AUDIO.TENSION, volume: 0.15 },
  F08:            { src: FACTION_AUDIO.TENSION, volume: 0.17, openStinger:  { src: FACTION_AUDIO.GONG,  volume: 0.15 } },
  COMMON_1:       { src: FACTION_AUDIO.TENSION, volume: 0.14 },
  COMMON_4:       { src: FACTION_AUDIO.SOFT,    volume: 0.12,                                           closeStinger: { src: FACTION_AUDIO.CHIME, volume: 0.09 } },
  COMMON_5:       { src: FACTION_AUDIO.SOFT,    volume: 0.13 },
  COMMON_7:       { src: FACTION_AUDIO.SOFT,    volume: 0.14 },
};

// 派閥イベントモーダル開幕時: BGM 切替 + openStinger
// 既存 BGM (management/tension chiptune 等) は FileBGM.play が内部で止める
function _factionAudioOpen(eventId) {
  const cfg = FACTION_AUDIO_MAP[eventId];
  if (!cfg) return;
  try { Audio.fileBgm.play(cfg.src, { loop: true, volume: cfg.volume }); } catch(e) {}
  if (cfg.openStinger) {
    // BGM が立ち上がる気配を見せてから1発鳴らす（fadeOut と重ならないように 150ms 遅延）
    setTimeout(() => { try { Audio.stinger(cfg.openStinger.src, cfg.openStinger.volume); } catch(e) {} }, 150);
  }
}

// 派閥イベント結果モーダル「閉じる」クリック時:
// closeStinger → BGM fadeOut → playForState で通常 BGM を復帰
function _factionAudioClose(eventId) {
  const cfg = FACTION_AUDIO_MAP[eventId];
  if (cfg && cfg.closeStinger) {
    try { Audio.stinger(cfg.closeStinger.src, cfg.closeStinger.volume); } catch(e) {}
  }
  try { Audio.fileBgm.fadeOut(1500); } catch(e) {}
  setTimeout(() => { try { Audio.bgm.playForState(); } catch(e) {} }, 1600);
}


// ── D層セレモニーイベント BGM制御 ──
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

// D層セレモニーイベント本体
// evt: MILESTONE_EVENTSエントリ（dialogueKey/narration/narrationGaps/visualVariant/continueLabel）
// speakers: [{fighter, roleLabel}, ...] (_resolveSpotlightFighters の戻り値)
// onContinue: 続けるボタンクリック時のコールバック
function showCeremonyEvent(evt, speakers, onContinue) {
  // タイトルサブ動的生成
  let titleSub = evt.titleSub;
  if (evt.visualVariant === 'arrival') {
    titleSub = evt.titleSub + ' ・ WEEK ' + G.week;
  } else if (evt.visualVariant === 'triumph') {
    const att = (G.lastShowAttendance || 0).toLocaleString();
    titleSub = evt.titleSub + ' ・ ' + att + ' ATTENDED';
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
        <button class="cerem-continue-btn">${evt.continueLabel || '続ける'}</button>
      </div>
    </div>
    <div class="cerem-hint">▼ クリックで進む</div>
    <button class="cerem-skip" data-cerem-skip>▷ SKIP</button>
  `;

  document.body.appendChild(overlay);
  _ceremAudioOpen(evt.visualVariant);

  // SceneController ロジック
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
  h2hHistoryMax: 50,     // h2h.history[] ペア毎上限
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
    delete state._pendingMilestone;
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
    // h2h.history トリミング (ペア毎最新N件)
    if (state.h2h) {
      for (const key in state.h2h) {
        const entry = state.h2h[key];
        if (entry && entry.history && entry.history.length > SAVE_TRIM.h2hHistoryMax) {
          entry.history = entry.history.slice(-SAVE_TRIM.h2hHistoryMax);
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
    state._saveVersion = '1.05';
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
      if (!G.orgName) G = { ...G, orgName: 'プレイヤー団体' };

      // v0.9b backward compat: offseason system
      if (G.offSeason === undefined) G = { ...G, offSeason: false, offWeek: 0 };
      // v0.9c backward compat: transfer
      if (G.pendingPoach === undefined) G = { ...G, pendingPoach: [] };
      // v0.9d backward compat: rental & events
      if (G.rentals === undefined && G.rental === undefined) G = { ...G, rentals: [], warThisSeason: false, challengeTrigger: null, pendingEvent: null };
      if (G.seasonStats === undefined) G = { ...G, seasonStats: { wins:0, losses:0, draws:0, showCount:0, totalRevenue:0, totalExpense:0, bestMQ:0, bestMQMatch:'', peakFunds:G.funds, peakPop:G.orgPop||0, eventsWon:0, eventsLost:0 }, seasonHistory: [], fundsHistory: [G.funds] };
      // 古いセーブで seasonStats のフィールドが欠落している場合に備えて補完（NaN/undefined→0 防止）
      {
        const _ssDefaults = { wins:0, losses:0, draws:0, showCount:0, totalRevenue:0, totalExpense:0, bestMQ:0, bestMQMatch:'', peakFunds:G.funds||0, peakPop:G.orgPop||0, eventsWon:0, eventsLost:0 };
        const _fixedSS = { ..._ssDefaults, ...(G.seasonStats || {}) };
        // 数値フィールドが NaN になっているケースを 0 に正規化
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

      // 安全弁: 王者がロスターに存在しない場合は空位にする（退団パス漏れ修復）
      if (G.titles?.world?.championId && !G.roster.find(c => c.id === G.titles.world.championId)) {
        G = { ...G, titles: { ...G.titles, world: { ...G.titles.world, championId: null, defenses: 0 } } };
        console.log('[Migration] 王者がロスターに不在のため王座を空位に修復しました');
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
      } else if ((G.roster || []).some(c => c?.isRental && c.rentalSeasonsLeft !== undefined && c.rentalWeeksLeft === undefined)) {
        const roster = (G.roster || []).map(c => {
          if (!c?.isRental || c.rentalSeasonsLeft === undefined || c.rentalWeeksLeft !== undefined) return c;
          const { rentalSeasonsLeft, ...rest } = c;
          return { ...rest, rentalWeeksLeft: (rentalSeasonsLeft || 1) * 12 };
        });
        G = { ...G, roster };
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
      // 社長室 Phase 2: 決裁枠マイグレーション
      if (G.decisionPoints === undefined) {
        G = { ...G, decisionPoints: 6, decisionPointsMax: 6, _migrated_decisionPoints_v1: true };
      }
      // 社長室 Phase 4: _decisionWeekUsed / _decisionDoneThisWeek 初期化
      if (G._decisionWeekUsed === undefined) {
        G = { ...G, _decisionWeekUsed: {} };
      }
      if (G._decisionDoneThisWeek === undefined) {
        G = { ...G, _decisionDoneThisWeek: [] };
      }
      if (G.roster && G.roster.some(f => f._decisionWeekUsed === undefined)) {
        G = { ...G, roster: G.roster.map(f => f._decisionWeekUsed === undefined ? { ...f, _decisionWeekUsed: {} } : f) };
      }
      // 社長室 Phase 5: _careWeekUsed → _decisionWeekUsed に統合
      if (G.roster && G.roster.some(f => f._careWeekUsed)) {
        G = { ...G, roster: G.roster.map(f => {
          if (!f._careWeekUsed) return f;
          const merged = { ...(f._decisionWeekUsed || {}), ...f._careWeekUsed };
          const { _careWeekUsed: _, ...rest } = f;
          return { ...rest, _decisionWeekUsed: merged };
        }) };
      }
      // 社長室 Phase 5: 旧ケアストック / _teamCareWeekUsed / _costumeDebut を削除
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
      // 社長室 Phase 7: pendingTrustDeltas 初期化 (trainer/camp の遅延発現トラック)
      if (G.roster && G.roster.some(f => f.pendingTrustDeltas === undefined)) {
        G = { ...G, roster: G.roster.map(f =>
          f.pendingTrustDeltas === undefined ? { ...f, pendingTrustDeltas: [] } : f
        ) };
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

      if (!G._migrated_factions_v1) {
        if (!Array.isArray(G.factions)) G = { ...G, factions: [] };
        if (!G.factionHostility || typeof G.factionHostility !== 'object') G = { ...G, factionHostility: {} };
        if (!G.factionEventCooldowns || typeof G.factionEventCooldowns !== 'object') G = { ...G, factionEventCooldowns: {} };
        G = { ...G, _migrated_factions_v1: true };
      }
      if (Array.isArray(G.factions) && G.factions.some(f => !f.flavor)) {
        G = { ...G, factions: G.factions.map(f => f.flavor ? f : { ...f, flavor: 'bond_first' }) };
      }
      // v0.2 アーキタイプ拡張: 旧 flavor を新 6 種にマイグレーション（一度だけ）
      if (Array.isArray(G.factions) && !G._migrated_archetype_v2) {
        G = {
          ...G,
          factions: G.factions.map(f => {
            // 旧 neutral は再判定 → 結束型 (bond_first) フォールバック
            // 旧 authoritativeTag 持ちの neutral は authoritarian へ
            let newFlavor = f.flavor || 'bond_first';
            if (newFlavor === 'neutral') {
              newFlavor = f.authoritativeTag ? 'authoritarian' : 'bond_first';
            }
            // タグの整合性確保
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

      // 派閥の重複所属を修復（Phase 3c セッションで発見された既存セーブのデータ破綻対応）
      if (!G._migrated_faction_dedupe_v1) {
        if (Engine.factions && typeof Engine.factions._dedupeFactionMembers === 'function') {
          G = Engine.factions._dedupeFactionMembers(G);
        }
        G = { ...G, _migrated_faction_dedupe_v1: true };
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

      // 団体年代記 v0.1 マイグレーション (chronicle-system-spec-v0.1.md)
      if (!G._migrated_chronicle_v1) {
        const chEmpty = Engine.chronicle.createEmpty();
        const peakPopularityOf = (f, fallbackSeason) => {
          const cr = f.careerRecord || {};
          const peakPopularity = Math.round(cr.peakPopularity ?? f.peakPopularity ?? f.popularity ?? f.pop ?? 0);
          const peakPopularitySeason = cr.peakPopularitySeason || f.peakPopularitySeason || fallbackSeason || 1;
          return { peakPopularity, peakPopularitySeason };
        };
        // HoF player エントリを archive 形式に変換
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
              ['華','ファンサービス','人望','ムードメーカー','熱血','名勝負製造機','ガラスのハート'].includes(t)
            ),
            retiredSeason: end
          };
        };
        // retiredFighter (player想定) を archive 形式に変換 (archiveFighter ロジック相当)
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
              ['華','ファンサービス','人望','ムードメーカー','熱血','名勝負製造機','ガラスのハート'].includes(t)
            ),
            retiredSeason: end
          };
        };
        const archivePlayer = [
          ...((G.allHallOfFame && G.allHallOfFame.player) || []).map(hofToArchive),
          ...((G.retiredFighters) || []).map(retiredToArchive)
        ];
        // 重複排除 (id ベース)
        const seenIds = new Set();
        const uniqueArchive = [];
        archivePlayer.forEach(a => {
          if (!a.id || seenIds.has(a.id)) return;
          seenIds.add(a.id);
          uniqueArchive.push(a);
        });
        // spirit の遡及積算
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
        // 初回章生成
        try {
          G = Engine.chronicle.buildChapters(G, { forceRebuild: true });
        } catch (e) {
          console.warn('[chronicle] 初回章生成に失敗:', e);
        }
      }

      // v0.2: coachSlots マイグレーション（既存セーブは雇用済みコーチ数に合わせて枠を初期化）
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

      // 序章 — 撤回した遡及マイグレーション (commit 17360df) の残留データ清掃
      // _migrated_prologue_v1 が立っているセーブは B案で作られた擬似序章が入っているため、
      // createEmpty() で初期化し直して既存挙動に戻す。
      // 通常の completeDraft 経路で作られた序章はこのフラグを立てないので無傷。
      if (G._migrated_prologue_v1 && Engine.prologue) {
        G = { ...G, prologue: Engine.prologue.createEmpty() };
        delete G._migrated_prologue_v1;
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
      // Legacy dormantPool refill migration retired; bounded recovery is handled elsewhere.
      if (!G._migrated_dormantPool_refill_v1) {
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

      // 成長マイルストーン通知 マイグレーション
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

      // affinityAxis 後付け (relationship-affinity-spec-v1.0 §3.2)
      if (!G._migrated_affinity_v1) {
        G = Engine.relationships.migrateAffinityAxisV1(G);
      }

      // 旧フォーマットの頂上決戦バックナンバー記事を新リッチ版で再生成
      // （fcfd9f4 「PPV頂上決戦の新聞記事をリッチ化」以前の保存データに残る "相手団体" プレースホルダ等を解消）
      if (!G._migrated_summit_news_v1) {
        const rebuildIssue = (wp) => {
          if (!wp || !wp.topStory) return wp;
          const ts = wp.topStory;
          if (ts.type !== 'ppvSummitResult' || !ts.summitData) return wp;
          const P = (Engine.newspaper && Engine.newspaper.PRIORITY) || null;
          const fixed = _buildPpvSummitStory(ts.summitData, wp.season || 1, wp.week || 1, P);
          return { ...wp, topStory: fixed };
        };
        const archive = Array.isArray(G.newspaperArchive)
          ? G.newspaperArchive.map(rebuildIssue)
          : G.newspaperArchive;
        const weeklyNewspaper = rebuildIssue(G.weeklyNewspaper);
        G = { ...G, newspaperArchive: archive, weeklyNewspaper, _migrated_summit_news_v1: true };
      }

      {
        const repair = Engine.saveDoctor.repairOnLoad(G);
        if (repair.changed) {
          G = repair.state;
          const note = `セーブデータ自動修復: ${repair.changes.join(', ')}`;
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
    // §C-6 過去対戦成績デッち上げ — AI団体ロスターに h2h/wins/Bond/Rivalry を刻む
    G = Engine.career.generateInheritedRecords(G);
    // v1.3: Record debut event for drafted fighters（経歴生成後に上書き — プレイヤー団体デビューを正式記録）
    G = { ...G, roster: G.roster.map(c => picks.includes(c.id)
      ? Engine.career.addEvent(c, { type: 'debut', season: G.season, week: G.week, orgId: 'player', orgName: G.orgName || 'プレイヤー団体', via: 'draft' })
      : c) };
    // 序章 (Phase 2): 旗揚げ5人を確定し org_founded ハイライトを刻む
    G = Engine.prologue.create(G);
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
    c = Engine.chronicle.applySpiritToFighter(c, G.chronicle); // Phase 4: 気風 trainCap 補正
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
    const log = [...G.gameLog, `📤 ${target.name}を解雇`];
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
      normalized = Engine.chronicle.applySpiritToFighter(normalized, G.chronicle); // Phase 4: 気風 trainCap 補正
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
      normalizedSigned = Engine.chronicle.applySpiritToFighter(normalizedSigned, G.chronicle); // Phase 4: 気風 trainCap 補正
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
      normalizedSigned = Engine.chronicle.applySpiritToFighter(normalizedSigned, G.chronicle); // Phase 4: 気風 trainCap 補正
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
    // scoutCandidates は今から dormantPool に返却する対象なので、ここでは占有扱いから外す
    (G.scoutCandidates || []).forEach(c => occupiedIds.delete(c.id));
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

    // 社長室に遷移（交渉モード）
    showScreen('shachoshitsu');

    const season = G.season || 1;
    const results = [];
    const preNegotiationRoster = (G.roster || []).map(f => ({ ...f }));
    const preNegotiationTitles = G.titles || {};
    let idx = 0;

    function processNext() {
      if (idx >= negotiations.length) {
        // 全交渉完了 → 結果サマリー
        const salaryChanges = App._buildContractRenewalSalaryChanges(
          results,
          preNegotiationRoster,
          preNegotiationTitles,
          G
        );
        showContractResultModal(results, salaryChanges, () => {
          // weekPhase を offseason に戻す（ナビロック解除 + advanceWeek の再ループ防止）
          const { pendingContractNegotiations: _, _contractAutoRenewed: __, ...clean } = G;
          G = { ...clean, weekPhase: 'offseason', gameLog: [...(G.gameLog || []), `📋 契約更新完了: 残留${results.filter(r => r.type === 'stay').length}名 退団${results.filter(r => r.type === 'depart').length}名`] };
          // 今週画面に戻ってから次週へ進める（社長室の交渉カードに留まらないように）
          showScreen('week');
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

    // サマリー画面 → 交渉開始
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
      // 理由を聞く → サブ選択
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
  // 引退はまだ commit されていない（roster に居る）— 本人を直接更新する
  doRetainFighter(fighterId) {
    const fighter = (G.roster || []).find(c => c.id === fighterId);
    if (!fighter) { closeRetirementPopup(); return; }
    // 引き留め上限チェック
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
    // Phase E: 引退撤回 history
    updatedFighter = Engine.career.addEvent(updatedFighter, { type: 'retireRetracted', season: G.season, week: G.week, orgName: G.orgName || 'プレイヤー団体' });
    G = { ...G, roster: G.roster.map(c => c.id === fighterId ? updatedFighter : c) };
    // O-13: 引退撤回 — 本人→団体全体 bond +5〜+8, 同僚全員→本人 bond +2〜+3
    if (G.relationships) {
      const retainRelRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, 0xBE46, G.season, fighterId));
      const rosterIds = G.roster.filter(c => c.id !== fighterId).map(c => c.id);
      G = Engine.relationships.applyToRoster(G, fighterId, rosterIds, { min: 5, max: 8 }, { min: 0, max: 0 }, retainRelRng);
      G = Engine.relationships.applyFromRoster(G, rosterIds, fighterId, { min: 2, max: 3 }, { min: 0, max: 0 }, retainRelRng);
    }
    // commit フェーズで除外するためのフラグ
    App._retainedIds = App._retainedIds || new Set();
    App._retainedIds.add(fighterId);
    Storage.autoSave();
    refreshAll();
    closeRetirementPopup();
    // 引き留め成功セリフ表示
    showEventPopup({
      type: 'fighter', id: fighter.id, name: fighter.name, tone: 'positive',
      message: retainLine, detail: `${fighter.name}の引き留めに成功しました（引き留め ${updatedFighter.retainCount}/2回目）`,
    });
  },

  // 社長室統合 Phase B: 解雇面談を開始（選手ポップアップの解雇ボタン → 社長室へ）
  startReleaseInterview(charId) {
    const fighter = G.roster.find(c => c.id === charId);
    if (!fighter) return;

    // カード登録中チェック（releaseFighter と同じ条件）
    const inCard = G.showCard.some(m => m.left === charId || m.right === charId);
    if (inCard) return;

    // 性格別セリフ選択（決定論的RNG）
    const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xF1E2, charId));
    const personality = fighter.personality || 'normal';
    const lines = RELEASE_INTERVIEW_LINES[personality] || RELEASE_INTERVIEW_LINES.normal;
    const dialogue = lines[Engine.rng.int(rng, 0, lines.length - 1)];

    // 面談中フラグをセット → 社長室画面に遷移
    G = { ...G, _releaseInterviewTarget: charId };
    showScreen('shachoshitsu');
    renderShachoshitsuReleaseInterview(fighter, dialogue);
    Audio.play('event');
  },

  // 解雇面談: 実行確定
  confirmRelease(charId) {
    G = { ...G, _releaseInterviewTarget: null };
    App.releaseFighter(charId);
    // releaseFighter内でrefreshAll+showEventPopupが呼ばれる
    // 社長室通常モードへ戻る
    renderShachoshitsu();
  },

  // 解雇面談: キャンセル
  cancelReleaseInterview() {
    G = { ...G, _releaseInterviewTarget: null };
    renderShachoshitsu();
    Audio.play('click');
  },

  // 社長室統合 Phase C: 内部タブ切替
  switchShachoshitsuTab(tabId) {
    G._shachoshitsuTab = tabId;
    G._shachoshitsuScoutPage = 0;
    renderShachoshitsu();
    Audio.play('click');
  },

  // 社長室統合 Phase C: スカウトページ送り
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
    // O-07: 解雇 — roster除外前に関係値更新（firing-grudge-spec-v0.1）
    let _firingGrudge = null;
    if (G.relationships) {
      const releaseRelRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, 0xBE45, G.season, charId));
      const colleagueIds = G.roster.filter(f => f.id !== charId).map(f => f.id);
      // 解雇者 → 残留組: ティア別（親友/元ライバル/一般）+ 解雇者の性格バイアス
      const firingResult = Engine.relationships.applyFiringGrudge(G, c, releaseRelRng);
      G = firingResult.state;
      _firingGrudge = firingResult.grudge;
      // 残留者 → 解雇者: 性格別 bond（同情・複雑な感情、過度に動かさない）
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
    const log = [...G.gameLog, `📤 ${c.name}を解雇`];
    if (titleMsg) log.push(titleMsg);
    // Phase E: 解雇 history を fighter に push
    let cWithRelease = Engine.career.addEvent(c, { type: 'release', season: G.season, week: G.week, fromOrg: G.orgName || 'プレイヤー団体' });
    // firing-grudge-spec-v0.1: 解雇キャラに遺恨フラグを付与（所属移動後も保持）
    if (_firingGrudge) cWithRelease = { ...cWithRelease, grudge: _firingGrudge };
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
      message: getTraitQuote('release', c), detail:`${cName}が団体を去りました` });
  },

  // ── タイトル奪還挑戦状（Phase 4） ─────────────────────────────────────
  openReclaimDialog() {
    if (!G.titles?.world?.externalHolder) return;
    if (!Engine.title.canIssueReclaim(G, 'world')) {
      Audio.play('error'); alert('現在は挑戦状を発行できません。'); return;
    }
    const eligible = G.roster.filter(c => !c.injury && !c.isRental && !c.forcedRest);
    if (eligible.length === 0) {
      Audio.play('error'); alert('挑戦可能な選手がいません。'); return;
    }
    const eh = G.titles.world.externalHolder;
    const heldByOrg = G.aiOrgs?.[eh.orgId];
    const heldByOrgName = heldByOrg?.name || eh.orgId;
    const exChamp = heldByOrg?.roster?.find(c => c.id === eh.fighterId);
    const exChampName = exChamp?.name || `元王者#${eh.fighterId}`;

    let dlg = document.getElementById('reclaimDialog');
    if (dlg) dlg.remove();
    dlg = document.createElement('div');
    dlg.id = 'reclaimDialog';
    dlg.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center';
    const opts = eligible
      .sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a))
      .map(c => `<option value="${c.id}">${c.name}（OVR ${Engine.util.ov(c)}）</option>`)
      .join('');
    dlg.innerHTML = `
      <div style="background:#1a1a24;border:1px solid #d4607a;border-radius:8px;padding:20px 24px;width:90%;max-width:480px;color:#eee">
        <div style="font-size:16px;font-weight:700;color:#ffb3c1;margin-bottom:10px">⚔ 奪還挑戦状の発行</div>
        <div style="font-size:12px;color:#bbb;line-height:1.7;margin-bottom:14px">
          <strong>${heldByOrgName}</strong> の <strong>${exChampName}</strong> に対して挑戦状を叩きつけます。<br>
          次の興行のメインで決戦。敗北時は12週間再挑戦できません。
        </div>
        <div style="margin-bottom:14px">
          <label style="font-size:12px;color:#aaa;display:block;margin-bottom:6px">挑戦者を選ぶ</label>
          <select id="reclaimChallengerSelect" style="width:100%;padding:8px;background:#0f0f18;border:1px solid #444;border-radius:4px;color:#eee;font-size:13px">${opts}</select>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button onclick="App._closeReclaimDialog()" style="padding:8px 16px;background:#333;border:1px solid #555;color:#ccc;border-radius:4px;cursor:pointer">キャンセル</button>
          <button onclick="App.confirmReclaim()" style="padding:8px 16px;background:linear-gradient(135deg,#d4607a,#a8334d);border:none;color:#fff;border-radius:4px;cursor:pointer;font-weight:600">挑戦状を発行</button>
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
    // 業界ニュース: 奪還挑戦状
    App._pushIndustryNews({
      type: 'reclaimChallenge',
      characterId: challengerId,
      data: {
        challengerName: c?.name || '挑戦者',
        fromOrg: G.orgName || 'プレイヤー団体',
        toOrg: orgName,
      },
    });
    showEventPopup({
      type: 'fighter', id: challengerId,
      name: c?.name || '挑戦者', tone: 'positive',
      message: `📜 ${c?.name} が ${orgName} へ挑戦状を叩きつけた！`,
      detail: `次の興行のメインで王座奪還の決戦が行われる。`,
    });
  },
  // Phase 6: 契約裏切り → 新聞ヘッドライン振り分け
  _consumeBetrayalNews(neg) {
    if (!G._lastBetrayalSummary) return;
    const sm = G._lastBetrayalSummary;
    let type;
    if (sm.isChampion && sm.beltCarried) type = 'contractBetrayalChampCarry';
    else if (sm.isChampion) type = 'contractBetrayalChampLeave';
    else if (sm.isRivalOrg) type = 'contractBetrayalRivalOrg';
    else if (sm.isAce) type = 'contractBetrayalAce';
    else type = 'contractBetrayalGeneric';
    const fromOrg = G.orgName || 'プレイヤー団体';
    const toOrg = G.aiOrgs?.[sm.toOrgId]?.name || sm.toOrgId || '他団体';
    App._pushNewsEvent({
      type, characterId: sm.departingId,
      data: { name: sm.departingName || neg?.fighterName || '選手', fromOrg, toOrg },
    });
    const { _lastBetrayalSummary, _lastBetrayalBeltCarried, ...rest } = G;
    G = rest;
  },

  cancelReclaim() {
    if (!G._pendingReclaim) return;
    if (!confirm('挑戦状を取り下げますか？（今シーズンの挑戦履歴は残ります）')) return;
    // pending challenge を取り下げ：reclaimChallenges から最新の未解決エントリを除去
    const newChallenges = (G.reclaimChallenges || []).filter((c, i, arr) => {
      // 直近の pending を1件だけ削除
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
    if (G.coaches.length >= maxCoaches) { Audio.play('error'); alert(`コーチは現在最大${maxCoaches}名まで（枠拡張で増加）`); return; }
    // A級雇用条件: 4枠目開放済み
    if (coach.grade === 'A' && (G.coachSlots || 1) < 4) { Audio.play('error'); alert('A級コーチの雇用には4枠目の開放が必要です'); return; }
    const fee = coach.hireFee || COACH_HIRE_FEE;
    if (G.funds < fee) { Audio.play('error'); alert('資金が足りません！'); return; }
    // 社長室 Phase 5: コーチ雇用は「コーチ雇用決裁書」(決裁枠2)を消費する
    const hireDoc = (typeof DECISION_DOCS !== 'undefined') ? DECISION_DOCS.hireCoach : null;
    const dpCost = (hireDoc && hireDoc.decisionCost) || 2;
    if ((G.decisionPoints || 0) < dpCost) {
      Audio.play('error');
      alert(`コーチ雇用には決裁枠 ⚡${dpCost} が必要です（現在: ⚡${G.decisionPoints || 0}）`);
      return;
    }
    G = {
      ...G,
      funds: G.funds - fee,
      decisionPoints: Math.max(0, (G.decisionPoints || 0) - dpCost),
      coaches: [...G.coaches, coachId],
      availableCoaches: G.availableCoaches.filter(id => id !== coachId),
      coachAssign: { ...G.coachAssign, [coachId]: [] },
      gameLog: [...G.gameLog, `🎓 ${coach.name}をコーチとして雇用（雇用費: ${fee}万、決裁枠 -${dpCost}）`]
    };
    refreshAll();
    showEventPopup({ type:'coach', id:coachId, name:coach.name, tone:'positive',
      message: pickQuote('coachHire'), detail:`🎓 ${coach.name}がコーチとして加入！（雇用費: ${fee}万、決裁枠 -${dpCost}）` });
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
    // orgPop リバランス v1.1 §5: ドーム年1回制限
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

  // Clear show card (resets all slots including tag entries to empty singles)
  clearShowCard() {
    const maxMatches = Engine.util.getMaxMatches(G.week, G.showVenue);
    const emptyCard = [];
    for (let i = 0; i < maxMatches; i++) emptyCard.push({left: 0, right: 0, isTitle: false});
    G = { ...G, showCard: emptyCard };
    renderShowPrep();
  },

  // ── Tag match slot management ──
  addTagSlot() {
    const card = [...G.showCard];
    // 空シングル枠を末尾から2つ探す
    let emptyCount = 0;
    for (let i = card.length - 1; i >= 0; i--) {
      if (!card[i].matchType && card[i].left === 0 && card[i].right === 0) emptyCount++;
    }
    if (emptyCount < 2) { Audio.play('error'); showToast('空き枠が足りません（タッグには2枠必要）'); return; }
    // 末尾から空シングル2つを除去
    let removed = 0;
    for (let i = card.length - 1; i >= 0 && removed < 2; i--) {
      if (!card[i].matchType && card[i].left === 0 && card[i].right === 0) { card.splice(i, 1); removed++; }
    }
    // タッグエントリーを末尾に挿入
    card.push({ matchType: 'tag', teamA: { fighter1: 0, fighter2: 0 }, teamB: { fighter1: 0, fighter2: 0 } });
    G = { ...G, showCard: card };
    renderShowPrep();
  },

  // シングル2枠を合体してタッグ1枠に（選手引き継ぎ）
  mergeToTagSlot(idx) {
    const card = [...G.showCard];
    if (idx < 0 || idx + 1 >= card.length) return;
    if (idx === 0) { Audio.play('error'); showToast('メインイベントはシングルマッチのみです'); return; }
    if (card[idx].matchType === 'tag' || card[idx + 1].matchType === 'tag') {
      Audio.play('error'); showToast('タッグ枠同士は合体できません'); return;
    }
    const s1 = card[idx], s2 = card[idx + 1];
    // 左コーナー同士→チームA、右コーナー同士→チームB
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
    // タッグ→シングル2枠に分割（選手を保持）
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

    // ── Phase 4: タイトル奪還挑戦の注入 ──
    App._reclaimData = null;
    if (G._pendingReclaim && G.titles?.world?.externalHolder) {
      const pr = G._pendingReclaim;
      const eh = G.titles.world.externalHolder;
      const challenger = G.roster.find(c => c.id === pr.challengerId);
      const aiOrg = G.aiOrgs?.[eh.orgId];
      const defender = aiOrg?.roster?.find(c => c.id === eh.fighterId);
      // 整合性チェック: 挑戦者が脱退/怪我等で参戦不可、または防衛者がAI団体ロスターから消えている → 取り下げ
      if (!challenger || challenger.injury || challenger.forcedRest || !defender) {
        const { _pendingReclaim, ...rest } = G;
        G = rest;
      } else {
        // 防衛者を player roster に isReclaim 印で一時注入
        const defenderForRoster = { ...defender, isReclaim: true, _reclaimOrgId: eh.orgId };
        // 既存メイン枠 (slot 0) を奪還挑戦試合に置き換え
        const newCard = [...G.showCard];
        const reclaimMatch = {
          left: pr.challengerId, right: defender.id,
          isTitle: true, isReclaim: true,
          _reclaimDefenderId: defender.id, _reclaimOrgId: eh.orgId,
        };
        if (newCard.length === 0) newCard.push(reclaimMatch);
        else newCard[0] = reclaimMatch;
        G = { ...G, showCard: newCard, roster: [...G.roster, defenderForRoster] };
        // validMatches も再構築（メインを反映）
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
          message: `⚔ 王座奪還の決戦！ ${challenger.name} vs ${defender.name}`,
          detail: `${aiOrg?.name || eh.orgId} に持ち去られた世界王座を取り戻せ！`,
        });
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

    // rivalry50+ ペアの宣戦布告ポップアップを検出（好敵手/宿怨は対象外、タッグはスキップ）
    // Phase 3e: F08 ロック試合は専用の試合前モーダルが優先するためここでは除外
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

    // 宣戦布告ポップアップは各試合がフォーカスされた瞬間に表示（renderMatchPreview内で制御）
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

  // 試合確定後の共通フロー: (観戦時のみ)試合後フレーバーポップアップ → renderMatchPreview → 全完了なら finalizeShow
  // (specs/match-flavor-popup-spec-v0.1.md §4.6)
  // opts.skipFlavor: true でスキップ(省略の意思表示)。余韻ポップアップを出さず即 finalize する。
  _afterMatchSettle(idx, opts) {
    const sp = App._showPreview;
    if (!sp) return;
    const skipFlavor = !!(opts && opts.skipFlavor);
    const result = sp.results[idx];
    const finalize = () => {
      renderMatchPreview();
      if (sp.results.every(r => r !== null)) App.finalizeShow();
    };
    // skipFlavor / _stale (選手不在フォールバック) のときは余韻スキップ
    if (skipFlavor || !result || result._stale) { finalize(); return; }
    App._runPostMatchFlavorForMatch(idx, result, finalize);
  },

  // Skip a single match (instant calculation) — 余韻フレーバーは出さない(省略の意思表示)
  skipMatch(idx) {
    const sp = App._showPreview;
    if (!sp || sp.results[idx]) return;
    // 一度でもスキップを押したら、その興行の残り全試合で pre/post-match フレーバーを抑制する
    sp._suppressFlavor = true;
    const staleFilled = App._fillMissingShowPreviewResults();
    if (sp.results[idx]) { App._afterMatchSettle(idx, { skipFlavor: true }); return; }
    const m = sp.validMatches[idx];
    // ── タッグマッチ ──
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
      // bond-rivalry plan P-1: bond ≤ 20 不仲ペアは試合中の能力 -3
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
      // P-1: 試合後 trust -1（不仲ペア両者）
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
    // ── シングルマッチ ──
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
    // ── タッグマッチ: tag-battle.html に分岐 ──
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
    // エンジン実行（recordFrames=true）— Replay 方式: シミュレート結果＋フレーム列を iframe へ渡して再生
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
    // Send match data to iframe (avoid contentDocument — causes SecurityError on file://)
    const iframe = document.getElementById('battleIframe');
    const msg = {
      type: 'START_MATCH',
      left: { ...charL, portraitUrl: getPortraitUrl(charL.id), profile: CHAR_PROFILES[charL.id] || '', vl: App._buildVlVsPlayerForExEmployee(charL, G.season, G.week), vsExHit: App._buildVsExHitLines(charL, G.season, G.week) },
      right: { ...charR, portraitUrl: getPortraitUrl(charR.id), profile: CHAR_PROFILES[charR.id] || '', vl: App._buildVlVsPlayerForExEmployee(charR, G.season, G.week), vsExHit: App._buildVsExHitLines(charR, G.season, G.week) },
      result,
      matchInfo: {
        header: m.isTitle ? (G.titles.world.championId ? '🏆 TITLE MATCH' : '🏆 初代王者決定戦') : (idx === 0 ? 'メインイベント' : `第${sp.validMatches.length - idx}試合`),
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
    // NOTE: singles は必ず battle-engine.html を使う（直前のタッグ試合で tag-battle.html に変わっていても戻す）
    iframe.onload = () => setTimeout(sendOnce, 200);
    iframe.src = 'battle-engine.html?t=' + Date.now();
    // Fallback: retry if onload was missed
    setTimeout(sendOnce, 800);
  },

  // タッグマッチを tag-battle.html で観戦
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
    // エンジン実行（recordFrames=true）
    const tagRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, m.teamA.fighter1, m.teamB.fighter1, 0x7A60));
    const bondA = G.relationships ? ((G.relationships[`${Math.min(f1.id,f2.id)}>${Math.max(f1.id,f2.id)}`] || {}).bond || 50) : 50;
    const bondB = G.relationships ? ((G.relationships[`${Math.min(f3.id,f4.id)}>${Math.max(f3.id,f4.id)}`] || {}).bond || 50) : 50;
    const tagExpA = Engine.tagExp.getCount(G, f1.id, f2.id);
    const tagExpB = Engine.tagExp.getCount(G, f3.id, f4.id);
    // bond-rivalry plan P-1: bond ≤ 20 不仲ペアは試合中の能力 -3
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
    // P-1: 試合後 trust -1（不仲ペア両者）
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
    // BGM: 通常 battle
    try { Audio.bgm.play('battle'); } catch(e) {}
    // iframe 表示
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
        header: idx === 0 ? 'メインイベント(タッグ)' : `第${sp.validMatches.length - idx}試合(タッグ)`,
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
    // Common-1 派閥内対決 context
    const c1 = App._common1Preview;
    if (c1 && c1.watching) {
      App._receiveCommon1BattleResult(data);
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
    // ── Replay方式: シングル/タッグともに sp.results[idx] に事前計算結果が既に入っている。iframe からは閉じるだけ ──
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
      // タッグは試合後フレーバーは出さない (`_collectPostMatchPopupsForMatch` 側で tag をスキップ)
      App._afterMatchSettle(tagIdx);
      return;
    }
    // Guard: single マッチも事前計算済み。iframe から MATCH_RESULT が来ても結果は上書きしない
    if (!sp.results[idx]) {
      // 想定外: watchMatch を通らず直接 MATCH_RESULT が来た場合のフォールバック
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
    // BGM: FileBGMフェードアウト + 残試合ありならbattle復帰、全完了ならjingleへ(finalizeShowで遅延再生)
    try { Audio.fileBgm.fadeOut(1500); } catch(e) {}
    if (sp.results.every(r => r !== null)) {
      // 全試合完了: management BGMは流さずjingle待機(finalizeShowで2.5秒後に再生)
    } else {
      // まだ試合が残っている → battleBGMを再開（興行中）
      // fadeOut後にBGM._current='battle'が残るため、stop()でリセットしてから再生
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

    // ── v4 §2-1: F02① ignite 判定（リーダー同士のカードが組まれていれば発火） ──
    if (Engine.factions && typeof Engine.factions.checkF02IgniteTrigger === 'function' && !s._pendingFactionEvent) {
      const ig = Engine.factions.checkF02IgniteTrigger(s, validMatches);
      if (ig.eligible) {
        s = { ...s, _pendingFactionEvent: { eventId: 'F02_IGNITE', payload: ig.payload } };
      }
    }

    // Rivalry & coach bonuses (タッグはスキップ)
    const confrontationPairs = sp.confrontationPairs || [];
    const deferredRivalryIdxs = []; // 因縁決着候補ペアの recordRivalry を MQ確定後まで保留
    results.forEach((result, i) => {
      const m = validMatches[i];
      if (m.matchType === 'tag') return; // タッグ試合は因縁・ケミストリーボーナス対象外
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

    // Fan expectation MQ bonus — MQ外部ボーナス整理で廃止。フラグのみ残す（タッグはスキップ）
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
      if (m.isReclaim) return; // Phase 4: 奪還挑戦試合は専用ハンドラで処理
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

    // v1.2: 乱入マッチ結果処理
    if (App._intrusionData) {
      const id = App._intrusionData;
      // 乱入選手がタイトルを奪取したか判定
      const intruderId = id.intruder.id;
      const intruderWon = titles.world.championId === intruderId;
      if (intruderWon) {
        // 王座空位 + ヒートダウン
        // v1.x修正: 振れ幅再設計 — 旧 -7〜-20 は値域[-10,+10]に対し過大かつ
        //   旧コード `Math.max(0, (s.heatScore || 50) + penalty)` に二重バグ
        //   (heat=0 が 50 に化ける / 下限0で負側帯を破壊) があり「最高潮→ニュートラル」一撃が発生していた。
        //   基本 -3〜-6、現在Hot/On Fire(hs≥6)帯では追加 -1〜-2。On Fire→ギリWarm までで止める。
        const intRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 8889));
        const basePenalty = -(3 + Engine.rng.int(intRng, 0, 3));
        const hotExtra = (s.heatScore || 0) >= 6 ? -(1 + Engine.rng.int(intRng, 0, 1)) : 0;
        const penalty = basePenalty + hotExtra;
        titles = { ...titles, world: { ...titles.world, championId: null, defenses: 0 } };
        s = { ...s, heatScore: Engine.util.clamp(Math.round(((s.heatScore ?? 0) + penalty) * 10) / 10, -10, 10) };
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

    // ── Phase 4: 奪還挑戦試合の結果処理 ──
    if (App._reclaimData) {
      const rd = App._reclaimData;
      const reclaimIdx = validMatches.findIndex(m => m.isReclaim);
      const r = reclaimIdx >= 0 ? results[reclaimIdx] : null;
      if (r) {
        const winnerId = r.winner === 'left' ? validMatches[reclaimIdx].left : (r.winner === 'right' ? validMatches[reclaimIdx].right : null);
        if (winnerId === rd.challengerId) {
          // 挑戦者勝利 → タイトル奪還
          const reclaimResult = Engine.title.resolveReclaimWin({ ...s, titles, roster }, 'world', rd.challengerId);
          titles = reclaimResult.titles;
          s = { ...s, aiOrgs: reclaimResult.aiOrgs, reclaimChallenges: reclaimResult.reclaimChallenges };
          // 新王者の人気微増（crownChampion 相当の小さなボーナスのみ。reassess は省略）
          roster = roster.map(c => c.id === rd.challengerId
            ? { ...c, popularity: Math.min(100, (c.popularity || 0) + Engine.popularity.applyDiminishing(5, c.popularity || 0)) }
            : c);
          events.push(`🏆 王座奪還！ ${rd.challengerName} が ${rd.orgName} から世界王座を取り戻した！`);
          // 業界ニュース: 奪還成功
          s = Engine.industryNews.push(s, {
            type: 'reclaimSuccess',
            characterId: rd.challengerId,
            data: {
              challengerName: rd.challengerName,
              fromOrg: G.orgName || 'プレイヤー団体',
              toOrg: rd.orgName,
            },
          });
        } else {
          // 挑戦失敗 → 12週CD
          const reclaimResult = Engine.title.resolveReclaimLoss(s, 'world');
          s = { ...s, reclaimChallenges: reclaimResult.reclaimChallenges };
          events.push(`💔 ${rd.challengerName} の奪還挑戦は失敗。${rd.orgName} が世界王座を防衛した。`);
          // 業界ニュース: 奪還失敗
          s = Engine.industryNews.push(s, {
            type: 'reclaimFailure',
            characterId: rd.challengerId,
            data: {
              challengerName: rd.challengerName,
              fromOrg: G.orgName || 'プレイヤー団体',
              toOrg: rd.orgName,
            },
          });
        }
      }
      // 防衛者を player roster から除去
      roster = roster.filter(c => !c.isReclaim);
      // pending クリア
      const { _pendingReclaim, ...rest } = s;
      s = rest;
      App._reclaimData = null;
    }

    // 集客v2: matchAppeals→showDraw→attendance算出
    const appFanExpects = Engine.fanExpect.generate(s);
    const appMatchAppeals = validMatches.map(m => {
      if (m.matchType === 'tag') {
        // タッグ: 4人の平均集客力で簡易計算
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
    // v1.5s25b: attendance_boost バフ（マイルストーン）
    const attendBoostBuffPre = (s.milestoneBuffs || []).find(b => b.type === 'attendance_boost');
    if (attendBoostBuffPre) preAttendance = Math.min(VENUES[s.showVenue].cap, Math.round(preAttendance * attendBoostBuffPre.multiplier));
    // mq_boost バフに付随する集客倍率（カードイベント effect 拡張で MQ+ と同時に集客効果を持つようになった）
    const mqBoostWithAttendance = (s.milestoneBuffs || []).find(b => b.type === 'mq_boost' && b.attendanceMultiplier);
    if (mqBoostWithAttendance) preAttendance = Math.min(VENUES[s.showVenue].cap, Math.round(preAttendance * mqBoostWithAttendance.attendanceMultiplier));
    // next_match_mq バフは特定ペア対象。該当ペアが showCard のいずれかに組まれていれば、その興行の集客倍率を適用
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
    // 興行結果画面で動員数を表示するためにstateに保存
    s = { ...s, lastShowAttendance: preAttendance };
    // D層 first_dome_sellout: postShow トリガー設定
    if (s.showVenue === 9 && !(s.milestones?.first_dome_sellout)) {
      const _domeCap = VENUES[9]?.cap || 22500;
      if (preAttendance / _domeCap >= 0.95) s = { ...s, _pendingDomeSelloutCeremony: true };
    }
    const crowdMQ = Engine.economy.calcCrowdMQBonus(s.showVenue, preOccRate);
    if (crowdMQ.total !== 0) {
      results.forEach(r => { r.mq = Engine.util.clamp(r.mq + crowdMQ.total, 5, 100); });
      if (crowdMQ.crowdLabel) {
        events.push(`🏟️ ${crowdMQ.crowdLabel}（MQ全試合 ${crowdMQ.total >= 0 ? '+' : ''}${crowdMQ.total}）`);
      }
    }

    // カード鮮度MQ補正（matchupLog記録の前に計算 — 今回の試合は履歴に含めない、タッグはスキップ）
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

    // MQ popularity (タッグ: 4人に分配)
    const mainEventIdx = 0; // index 0 = main event in showCard order
    results.forEach((r, idx) => {
      const m = validMatches[idx];
      const isMainEvent = idx === mainEventIdx;
      if (r.matchType === 'tag') {
        // タッグ: perFighterの全選手にMQ人気を適用（Engine.executeShow L7709パターン）
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
    // 集客v2: ★算出
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
      events.push(`🔥 注目カード効果: 因縁カード編成で団体人気${bookedRivalryOrgPopBonus >= 0 ? '+' : ''}${Math.round(bookedRivalryOrgPopBonus * 10) / 10}`);
    }
    events.push(`📊 ★${appStars} (MQ avg ${avgMQ}) → 団体人気${popResult.popDelta >= 0 ? '+' : ''}${Math.round(popResult.popDelta * 100) / 100} (現在: ${Engine.util.dispOrgPop(popResult.orgPop)})`);

    // Heat — ★ベース
    const oldHeat = Engine.heat.getLevel(s);
    const newHeatScore = Engine.heat.calcUpdate(s, appStars);
    const newHeat = Engine.heat.getLevel({ ...s, heatScore: newHeatScore });
    if (oldHeat.id !== newHeat.id) events.push(`${newHeat.emoji} Heat変動: ${oldHeat.label} → ${newHeat.label}（集客倍率 ×${newHeat.mult}）`);

    // Injuries — separate RNG per fighter to avoid correlation (タッグはスキップ — Phase 5対応)
    const injuryResults = [];
    const matchInjuredIds = new Array(results.length).fill(null); // Phase 2: 試合別怪我選手ID
    results.forEach((r, idx) => {
      if (r.matchType === 'tag') return; // タッグ試合の怪我はPhase 5で対応
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
        const m = validMatches[idx];
        // タッグマッチ: applyTagMatchResult で4者間の関係値を更新
        if (r.matchType === 'tag') {
          const teamAIds = [m.teamA.fighter1, m.teamA.fighter2];
          const teamBIds = [m.teamB.fighter1, m.teamB.fighter2];
          relState = Engine.relationships.applyTagMatchResult(relState, teamAIds, teamBIds, r, relRng);
          return;
        }
        // シングルマッチ
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
          // Phase 4: 奪還挑戦は cross-org 試合（残留 vs 元同僚 / B-3 などが効く）
          isCrossOrg: !!m.isReclaim,
        };
        relState = Engine.relationships.applyMatchResult(relState, charIdA, charIdB, context, relRng);
      });
      roster = relState.roster || roster;
      s = { ...s, relationships: relState.relationships, relationshipCounters: relState.relationshipCounters };
      // Phase 4: 興行コンテキストの関係値反映（C-04/C-05/C-06/C-10）
      const showCtxRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBE5C));
      s = Engine.relationships.applyShowContextEffects(s, validMatches, results, preShowLosingStreaks, showCtxRng);
    }

    // ── F08 ディレクティブ: 直接対決試合の結果を派閥勢い/対立度に 1.5× で反映
    //    + 両派閥リーダー間 rivalry に +30〜40 の大幅ブースト + ディレクティブクリア ──
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
        // 両リーダー間 rivalry を +30〜40 の大幅ブースト（通常試合 +5〜10 の 4 倍程度）
        // → リーダー同士の因縁が強烈に深まり、次の F02/F03 への発展を加速
        const rivalryBoost = 30 + Math.floor(Engine.rng.float(f08Rng) * 11);
        const keyAB = `${d.leaderAId}|${d.leaderBId}`;
        const keyBA = `${d.leaderBId}|${d.leaderAId}`;
        const rels = { ...(s.relationships || {}) };
        if (rels[keyAB] && rels[keyBA]) {
          const clamp = (v) => Math.max(-100, Math.min(100, v));
          rels[keyAB] = { ...rels[keyAB], rivalry: clamp((rels[keyAB].rivalry || 0) + rivalryBoost) };
          rels[keyBA] = { ...rels[keyBA], rivalry: clamp((rels[keyBA].rivalry || 0) + rivalryBoost) };
          s = { ...s, relationships: rels };
          if (typeof console !== 'undefined') console.log(`[WM Faction] F08 direct bout rivalry boost: leaders ${d.leaderAId}↔${d.leaderBId} rivalry +${rivalryBoost}`);
        }
        executed = true;
      });
      // 該当試合が実行されたかに関わらず、この興行後はディレクティブを落とす
      if (executed && typeof console !== 'undefined') console.log('[WM Faction] F08 directive resolved by direct match');
      const { _pendingF08Directive: _, ...rest } = s;
      s = rest;
    }

    // ── Phase C: F07 DEMAND_MAIN ディレクティブ消化（6興行縛り）──
    // 各興行ごとに評価: メインに当該派閥メンバーが入っていれば members trust +1、
    // 入っていなければ leader trust -2。remainingShows をデクリメント、0 で解除。
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
      // remainingShows をデクリメント、0 で解除
      const remaining = (dir.remainingShows != null ? dir.remainingShows : 1) - 1;
      if (remaining > 0) {
        s = { ...s, _pendingF07Directive: { ...dir, remainingShows: remaining } };
      } else {
        const { _pendingF07Directive: _, ...restF07 } = s;
        s = restF07;
        if (typeof console !== 'undefined') console.log(`[WM Faction] F07 DEMAND_MAIN directive expired`);
      }
    }

    // ── Phase B: F09 派閥対抗戦 — sweep ボーナス適用 + Ending モーダル予約 + pending クリア ──
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
      // factionTimeline に F09 完遂エントリ
      if (Array.isArray(s.factionTimeline)) {
        s = { ...s, factionTimeline: [...s.factionTimeline, {
          type: 'F09_RESOLVED',
          season: s.season, week: s.week,
          factionAId: f09.factionAId, factionBId: f09.factionBId,
          matchCount: sweepResults.length,
        }]};
      }
      // Ending モーダル用ペイロードを予約（drainF09Ending で消費）
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
            narration: `${winF.name}が${winF.name === winF.name && winsA > winsB ? winsA + '勝' + winsB + '敗' : winsB + '勝' + winsA + '敗'}で${losF.name}を制した――対抗戦は決着した。`,
          }};
        }
      }
      const { _pendingF09: _f9, ...restF9 } = s;
      s = restF9;
      if (typeof console !== 'undefined') console.log('[WM Faction] F09 sweep bonus applied');
    }

    // ── Phase 3e: F08-A 試合後 派閥関係追加変動 + アフターマスモーダル予約 ──
    // _f08Locked がついた試合のうち、勝敗確定したものに対して発火。
    // F02③ resolution が同時発火する試合は extra 効果スキップ（resolution 優先）。
    if (Engine.factions && typeof Engine.factions.applyF08PostMatchExtraEffects === 'function') {
      validMatches.forEach((m, idx) => {
        if (!m._f08Locked) return;
        if (m.matchType === 'tag') return;
        const r = results[idx];
        if (!r || r.winner === 'draw') return;
        const winnerId = r.winner === 'left' ? m.left : m.right;
        const loserId  = r.winner === 'left' ? m.right : m.left;

        // F02③ resolution 同時発火判定（リーダー同士 + 両方向 hostility ≥60）
        let isF02ResolutionFiring = false;
        if (typeof Engine.factions.rollResolutionAfterMatch === 'function') {
          const probe = Engine.factions.rollResolutionAfterMatch(s, { winnerId, loserId, isDraw: false });
          if (probe && probe.pendingEvent && probe.pendingEvent.eventId === 'F02_RESOLUTION') {
            isF02ResolutionFiring = true;
          }
        }

        // HP残量パーセント
        const loserSide = (winnerId === m.left) ? 'right' : 'left';
        const loserHp = (loserSide === 'left' ? r.hpLeft : r.hpRight) || { final: 0, max: 100 };
        const loserHpPct = (loserHp.max > 0) ? (loserHp.final / loserHp.max) : 0;
        const winnerHp = (loserSide === 'left' ? r.hpRight : r.hpLeft) || { final: 0, max: 100 };
        const winnerHpPct = (winnerHp.max > 0) ? (winnerHp.final / winnerHp.max) : 1;

        const matchResult = { winnerId, loserId, winnerHpPct, loserHpPct };

        // 1) 派閥関係追加変動
        s = Engine.factions.applyF08PostMatchExtraEffects(s, matchResult, isF02ResolutionFiring);

        // 2) アフターマスモーダル予約（F02③ 同時発火時はスキップ — resolution 演出が優先）
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

    // ── v4 §2-1: F02③ 決着 判定（リーダー同士の敵対試合で両方向hostility≥60） ──
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

    // v1.2: タイトルマッチ実施時に絶対週数を記録
    const executedTitleMatch = validMatches.some(m => m.isTitle);
    const lastTitleMatchWeek = executedTitleMatch
      ? Engine.title.getAbsWeek(s)
      : (s.lastTitleMatchWeek ?? null);

    // v1.3-2: §2 試合成長 — 怪我処理後、ロスターに残っている出場選手に成長を与える (mirrors Engine.executeShow)
    const matchGrowthRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 1732));
    results.forEach((r, rIdx) => {
      const m = validMatches[rIdx];
      // タッグマッチ: 4人に成長配分（Engine.executeShow L8087-8117パターン）
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
        if (preOppOvr !== null) { oppOvr = preOppOvr; } // タッグ: 事前計算済み
        else {
          const oppId = charId === r.left.id ? r.right.id : r.left.id;
          const oppInRoster = roster.find(c => c.id === oppId);
          const oppRaw = charId === r.left.id ? r.right : r.left;
          oppOvr = oppInRoster ? Engine.util.ov(oppInRoster) : Engine.util.ov(oppRaw);
        }
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

    // v1.8: §2 ブレークスルー判定 & careerBestMQ 更新（試合後）
    const pendingGrowthEvents = [];
    const btRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xB818));
    results.forEach((r, rIdx) => {
      const m = validMatches[rIdx];
      // タッグマッチ: 4人にブレークスルー・スランプ判定
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

    // h2h記録: ペア別対戦履歴（タッグ: 対角4ペア + 味方ペア記録）
    let h2h = { ...(s.h2h || {}) };
    results.forEach((r, idx) => {
      const m = validMatches[idx];
      if (m.matchType === 'tag') {
        // タッグ: 対角4ペア（A1vsB1, A1vsB2, A2vsB1, A2vsB2）を記録
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
        // 業界ニュース: B-3 元同僚 離脱後初対面（試合カード=単発のみ）
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

    // recentMatches記録（直近5戦FIFO）
    results.forEach((r, idx) => {
      const m = validMatches[idx];
      if (m.matchType === 'tag') {
        // タッグ: 対角ペアで記録
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

    // matchupLog 記録（鮮度計算の後、最終更新の前）
    const newMatchupEntries = [];
    validMatches.forEach(m => {
      if (m.matchType === 'tag') {
        // タッグ: 対角4ペアのmatchupLogを記録
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

    // tagExp記録: タッグ試合のチームメイトペアの経験値を蓄積
    let tagExp = { ...(s.tagExp || {}) };
    validMatches.forEach((m, idx) => {
      if (m.matchType !== 'tag') return;
      tagExp = Engine.tagExp.increment(tagExp, m.teamA.fighter1, m.teamA.fighter2);
      tagExp = Engine.tagExp.increment(tagExp, m.teamB.fighter1, m.teamB.fighter2);
    });
    s = { ...s, roster, matchupLog: [...(s.matchupLog || []), ...newMatchupEntries], tagExp };

    // MVPレース v2: MQ85超試合の bigMatch 履歴記録（プレイヤー興行）
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

    // orgPop リバランス v1.1 §4: ドーム興行 domeMain キャリア記録
    // メインイベント枠(idx=0) or タイトルマッチに出場した選手を記録
    if (s.showVenue === 9) {
      roster = roster.map(c => c); // コピーを維持
      validMatches.forEach((m, idx) => {
        const isMain = idx === 0; // メインイベント枠
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
      // orgPop リバランス v1.1 §5: ドーム興行カウント更新
      s = { ...s, roster, domeShowsThisSeason: (s.domeShowsThisSeason || 0) + 1 };
    }
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
      // 関係値凍結 + trust影響 + retiredIds永続記録
      const newRetiredIds = [...(G.retiredIds || []), ...lastRunRetirees.map(c => c.id).filter(id => !(G.retiredIds || []).includes(id))];
      const _lrRetiredSeasons = { ...(G.retiredSeasons || {}) };
      lastRunRetirees.forEach(c => { _lrRetiredSeasons[c.id] = G.season; });
      let updState = { ...G, roster: survivingRoster, retiredFighters: [...(G.retiredFighters || []), ...retiredWithRecords], retiredIds: newRetiredIds, retiredSeasons: _lrRetiredSeasons };
      // 団体年代記: アーカイブ登録 + 気風寄与積算 (player ロスター経由なので全件対象)
      retiredWithRecords.forEach(rf => {
        updState = Engine.chronicle.archiveFighter(updState, rf);
        updState = Engine.chronicle.applySpiritContribution(updState, rf);
      });
      updState = Engine.chronicle.refreshChapters(updState);
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
    // 結果画面表示直後にBGMを試合用→経営用へ切り替え（ファンファーレは廃止）
    setTimeout(() => {
      try { Audio.fileBgm.stop(); } catch(e) {}
      Audio.bgm.play('management');
    }, 2500);

    // 新聞データをGに保存（データベースタブで閲覧）
    try {
      const paperData = App._buildShowResultNewspaperData();
      if (paperData) {
        G = { ...G, currentNewspaper: { ...paperData, generatedWeek: G.week, generatedSeason: G.season } };
      }
    } catch (e) {
      console.error('[WM] 新聞データ生成エラー:', e);
    }

    // 試合前/試合後フレーバーポップアップは per-match で流れる
    // (renderMatchPreview の nextIdx フォーカス時 + skipMatch/watchMatch 結果反映直後)
    // ため、ここでは結果画面を直接描画する。
    // Phase 3e: F08-A 試合後モーダルが予約されていれば結果画面前に逐次消化
    // F09 Ending モーダル（F08 aftermath より先に出す: 対抗戦の総括が先）
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

  // 試合前フレーバーポップアップの収集（specs/match-flavor-popup-spec-v0.1.md §4.2）
  // 1試合分のポップアップ配列を返す。renderMatchPreview の nextIdx フォーカス時に呼ばれる。
  // 試合シミュレーション結果は不要 — 検出は roster / matchupLog / relationships を試合前に参照する。
  // 段階拡張時はこの中に検出条件 + popups.push ブロックを追加する。
  _collectPreMatchPopupsForMatch(idx) {
    const popups = [];
    const sp = App._showPreview;
    if (!sp || !sp.validMatches) return popups;
    const m = sp.validMatches[idx];
    if (!m || m.matchType === 'tag') return popups; // タッグは現状非対応
    const leftId = m.left, rightId = m.right;
    if (!leftId || !rightId) return popups;
    const leftFighter  = (G.roster || []).find(c => c.id === leftId) || ALL_CHARS.find(c => c.id === leftId);
    const rightFighter = (G.roster || []).find(c => c.id === rightId) || ALL_CHARS.find(c => c.id === rightId);
    if (!leftFighter || !rightFighter) return popups;

    // ── 初顔合わせ（matchupLog に過去対戦が無いかで判定）──
    const log = G.matchupLog || [];
    const hasPriorMatch = log.some(e =>
      (e.left === leftId && e.right === rightId) || (e.left === rightId && e.right === leftId)
    );
    if (!hasPriorMatch) {
      const leftLine  = pickDialogueLine(FIRST_MEET_LINES, leftFighter);
      const rightLine = pickDialogueLine(FIRST_MEET_LINES, rightFighter);
      popups.push({
        type: 'fighter', id: leftId, name: leftFighter.name,
        message: leftLine, detail: '✨ 初対決', autoCloseMs: 1800, sound: 'event',
      });
      popups.push({
        type: 'fighter', id: rightId, name: rightFighter.name,
        message: rightLine, detail: '✨ 初対決', autoCloseMs: 1800, sound: 'event',
      });
    }
    // ── 段階拡張ポイント: 他のプラス効果はここに追加 ──
    return popups;
  },

  // 試合後フレーバーポップアップの収集（specs/match-flavor-popup-spec-v0.1.md §4.6）
  // 試合結果から勝者/敗者の余韻一言を返す。skipMatch/watchMatch で結果反映直後に呼ぶ。
  _collectPostMatchPopupsForMatch(idx, result) {
    const popups = [];
    const sp = App._showPreview;
    if (!sp || !result || result.matchType === 'tag') return popups;
    if (result.winner === 'draw') return popups; // ドローは余韻スキップ（中立)
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
      message: winLine, detail: '🏆 勝者の余韻', autoCloseMs: 1800, sound: 'event',
    });
    popups.push({
      type: 'fighter', id: loserId, name: loserFighter.name,
      message: loseLine, detail: '— 敗者の心 —', autoCloseMs: 1800, sound: 'event',
    });
    return popups;
  },

  // pre-match popup シーケンスを 1試合分流す。renderMatchPreview のフォーカスフックから呼ばれる。
  // 既存の confrontation modal が表示中なら、それが閉じてからフレーバー popup を流す。
  _runPreMatchFlavorForMatch(idx) {
    const sp = App._showPreview;
    if (!sp) return;
    if (sp._suppressFlavor) return; // 一度スキップしたら以降のフレーバーは抑制
    if (!sp._shownPreFlavor) sp._shownPreFlavor = new Set();
    if (sp._shownPreFlavor.has(idx)) return;
    sp._shownPreFlavor.add(idx);

    // Phase 3e: F08-A 試合前モーダル発火（rivalry/初顔合わせ等より優先、出したら他はスキップ）
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
          return; // 他フレーバーはスキップして試合進行
        }
      }
    }

    // Phase B-2: F09 試合前モーダル発火（_f09Locked 試合）— 初の F09 試合では Opening も連結
    if (m && m._f09Locked && typeof Engine !== 'undefined' && Engine.factions) {
      const matchId = `${G.season}-${G.week}-${idx}`;
      if (!G._shownF09PreMatchIds) G._shownF09PreMatchIds = [];
      if (!G._shownF09PreMatchIds.includes(matchId)) {
        const data = App._buildF09MatchPreData(m, idx);
        if (data) {
          G._shownF09PreMatchIds = [...G._shownF09PreMatchIds, matchId];
          // 興行内最初の _f09Locked 試合 → Opening を先に
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

  // post-match popup シーケンスを 1試合分流し、then() を呼ぶ。
  // skipMatch/watchMatch で sp.results[idx] 反映直後に呼ぶ。
  _runPostMatchFlavorForMatch(idx, result, then) {
    // Phase B-2: F09 試合後モーダル（_f09Locked 試合）— popup 群より先に出す
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

  // ── Phase B-2: F09 モーダル用データ構築ヘルパ ──
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
    // _pendingF09 はすでにクリア済みかもしれないので、試合の所属派閥から逆引き
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
      narration: `${fA.name}と${fB.name}――両派閥の積年の抗争が、ついに対抗戦という形で全面決着の夜を迎える。`,
    };
  },
  _buildF09MatchPreData(m, idx) {
    const fA = Engine.factions.getFactionByFighterId(G, m.left);
    const fB = Engine.factions.getFactionByFighterId(G, m.right);
    if (!fA || !fB) return null;
    const cA = (G.roster || []).find(c => c.id === m.left);
    const cB = (G.roster || []).find(c => c.id === m.right);
    if (!cA || !cB) return null;
    // 全F09試合数をカウント
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
    // 現在スコア（pendingF09 はクリアされている可能性があるので factionRivalryPoints から取得）
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
      ptDelta: 0,  // 現状の差分計算は未実装、後段で表示
      currentScore: { a: scoreA, b: scoreB, aName, bName },
    };
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
    else if (d.isTitleMatch) cat = d.isTitleDefense ? 'titleDefend' : 'titleWin';
    else if (d.isUpset) cat = 'upset';
    else if (d.hasRivalry) cat = 'rivalry';
    else if (d.isDominant) cat = 'dominant';
    else if (d.isCloseMatch && d.isHighMQ) cat = 'closeMQ';
    else if (d.isLowMQ) cat = 'normal';
    else cat = 'normal';

    // タイトルマッチ確定（superMQ/upset は歴史的名勝負/番狂わせ表現を優先）
    if (d.isTitleMatch && !d.isDraw) {
      if (cat !== 'superMQ' && cat !== 'upset') {
        cat = d.isTitleDefense ? 'titleDefend' : 'titleWin';
      }
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

    // タイトルマッチの場合、防衛/奪取を判定（_lastTitleOutcomes は本関数呼び出し直前に設定されている）
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

    // ─── テキスト生成 ───
    const np = App._generateNewspaperTexts({
      isDraw, winner, loser, left: main.left, right: main.right,
      isTitleMatch: !!main.isTitleMatch, isTitleDefense, finishLabel, turns, mq,
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
          App._showResultInlinePreview.shownSignatures.add(App._glimpseSignature(glimpse));
        });
        showGlimpseCascade(tier1, { allowWhileShowResult: true });
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
    // D層 postShow: 超満員ドームセレモニー（tickWeek 前に発火）
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

    // 試合後コメントポップアップ（因縁マッチ）
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
    // 怪我引退セリフの取りこぼし救済: lookup 失敗・transient 欠落で _pendingInjuryRetirements に
    // 載らなかった「今週の怪我引退者」を retiredFighters の最新 retire イベントから復元する
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

    // ラストラン引退（引退試合完了後の即引退）
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
    // ラストラン引退セリフの取りこぼし救済(第3層): processShowResult / fallback の両方で
    // 拾えなかった場合に、retiredFighters の最新 retire イベント (reason='lastrun', 同週)
    // から復元する。これで本人ポップアップがゼロになる事故を防ぐ。
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
      if (!ch || !ir.injury) return;
      hasEventPopups = true;
      setTimeout(() => {
        showEventPopup({
          type: 'fighter', id: ch.id, name: ch.name, tone: 'negative',
          message: getTraitQuote('injury', ch),
          detail: `🏥 ${ir.injury.type} — 全治${ir.injury.weeksLeft}週間`,
        });
      }, i * 100);
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
    App.checkSurvivalUpdate();
    App.checkTitleEstablishment(); App.checkRosterCapMilestones();
    App.checkPrologueHighlights();
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
    // R3反応モーダル（bond 75+ 仲間の別れリアクション）は本人引退ポップアップの後に出す。
    // 旧実装は独立 setTimeout(800) で発火していたため、本人ポップアップが遅延すると
    // R3 が先に開いて本人ポップアップが出ない/見落とされる事故が発生していた。
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
        // showR3Modal は単発モーダルで done コールバックを持たないため、即座に次へ繋ぐ
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

    // relationship-flags-spec-v1.0 §4: 試合発火系の関係性フラグモーダル
    if (typeof _drainFlagModalQueue === 'function') _drainFlagModalQueue();

    // Common-3 派閥加入通知（興行後に発生したものも消化）
    App._drainFactionJoinNotices();

    // §6 アーキタイプ遷移ナレーション（F02 完全敗北など興行後に発生する）
    App._drainArchetypeTransitions();

    // スナップショット R3モーダルは popupActions チェーン内（本人引退ポップアップの後）に
    // 組み込み済みのため、ここでは別経路の setTimeout 発火はしない。

    // P4-P6: Glimpse（心の垣間見え）表示（興行後）
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
        setTimeout(() => { showGlimpseCascade(tier1); }, 900);
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

  // Common-3: 派閥加入通知キューを順次表示
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

  // §6 アーキタイプ遷移ナレーションキューを順次表示
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

  // firing-grudge-spec-v0.1 Phase 5: 解雇キャラ vs 元雇用団体（player）専用セリフを iframe に配信。
  // fighter.grudge.vsOrgId === 'player' & intensity ≥ 60 & 解雇から 24 週以内 で発動。
  _vsExEmployeeFires(fighter, season, week) {
    if (!fighter || !fighter.grudge) return false;
    const g = fighter.grudge;
    if (g.vsOrgId !== 'player') return false;
    if (!g.intensity || g.intensity < 60) return false;
    const nowAbs = (season - 1) * 20 + (week || 1);
    const firedAbs = ((g.issuedSeason || 1) - 1) * 20 + (g.issuedWeek || 1);
    if (nowAbs - firedAbs > 24 || nowAbs - firedAbs < 0) return false;
    if (typeof VS_EX_EMPLOYER_LINES === 'undefined') return false;
    return true;
  },

  // 通常の VICTORY_LINES の前段に VS_EX_EMPLOYER_LINES[personality].win を prepend して引きやすくする。
  _buildVlVsPlayerForExEmployee(fighter, season, week) {
    const baseVl = (fighter && (fighter.voiceLines || fighter.vl))
      || (typeof VICTORY_LINES !== 'undefined' && fighter && VICTORY_LINES[fighter.id])
      || ['…！'];
    if (!App._vsExEmployeeFires(fighter, season, week)) return baseVl;
    const pers = fighter.personality || 'normal';
    const winArr = (VS_EX_EMPLOYER_LINES[pers] || VS_EX_EMPLOYER_LINES.normal || {}).win || [];
    if (winArr.length === 0) return baseVl;
    return [...winArr, ...baseVl];
  },

  // 被弾セリフ（hit）配列を返す。条件不成立なら null を返す。iframe 側 tryDamageLine が拾う。
  _buildVsExHitLines(fighter, season, week) {
    if (!App._vsExEmployeeFires(fighter, season, week)) return null;
    const pers = fighter.personality || 'normal';
    const hitArr = (VS_EX_EMPLOYER_LINES[pers] || VS_EX_EMPLOYER_LINES.normal || {}).hit || [];
    return hitArr.length > 0 ? hitArr : null;
  },

  // 業界ニュースキューに追加（毎週の新聞画面・業界ニュース欄に流れる）
  _pushIndustryNews(ev) {
    if (!ev || !ev.type) return;
    G = { ...G, _industryNewsEvents: [...(G._industryNewsEvents || []), ev] };
  },

  // challenge-request-spec-v0.1 Phase 3: 試合結果を h2h / career / 業界ニュースに反映
  // forward: teamA = player roster / teamB = AI org roster
  // inverse: teamA = AI org (grudge保持) roster / teamB = player roster
  _applyChallengeRequestResult(state, card, result) {
    let s = { ...state };
    const isInverse = !!card.isInverse;
    const requesterOrgId = card.requesterOrgId || (isInverse ? card.requesterOrgId : 'player');
    const opponentOrgId = card.opponentOrgId || (isInverse ? 'player' : card.otherOrgId);

    // h2h 更新（3 ペア）
    let h2h = { ...(s.h2h || {}) };
    for (let i = 0; i < 3; i++) {
      const m = result.matches[i];
      h2h = Engine.h2h.update(
        h2h,
        m.fighterA.id, m.fighterB.id,
        m.winner, m.mq,
        false, false,
        s.season, s.week,
        'show',
        requesterOrgId, opponentOrgId,
        null
      );
    }
    s = { ...s, h2h };

    const teamWinSide = result.teamWin; // 'A' | 'B' | 'draw'
    const teamResultForA = teamWinSide === 'A' ? 'win' : (teamWinSide === 'B' ? 'lose' : 'draw');
    const teamResultForB = teamWinSide === 'B' ? 'win' : (teamWinSide === 'A' ? 'lose' : 'draw');

    // helper: ロスターから teamA / teamB のキャラを更新
    const _updateRoster = (rosterArr, teamSide /* 'A' | 'B' */) => rosterArr.map(f => {
      const team = teamSide === 'A' ? card.teamA : card.teamB;
      const oppTeam = teamSide === 'A' ? card.teamB : card.teamA;
      const oppOrg = teamSide === 'A' ? opponentOrgId : requesterOrgId;
      const tr = teamSide === 'A' ? teamResultForA : teamResultForB;
      const score = teamSide === 'A' ? `${result.winsA}-${result.winsB}` : `${result.winsB}-${result.winsA}`;
      for (let i = 0; i < 3; i++) {
        if (team[i].id === f.id) {
          const m = result.matches[i];
          const won = teamSide === 'A' ? m.winner === 'left' : m.winner === 'right';
          return Engine.career.addEvent(f, {
            type: 'challenge_request_match',
            season: s.season, week: s.week,
            opponentName: oppTeam[i].name,
            opponentOrg: oppOrg,
            won,
            matchType: 'team3v3',
            teamResult: tr,
            teamScore: score,
            isRequester: f.id === card.requesterId,
            isInverse,
          });
        }
      }
      return f;
    });

    // 打診者陣ロスター更新
    if (isInverse) {
      // 打診者陣 = AI org
      const aiOrgs = { ...(s.aiOrgs || {}) };
      if (aiOrgs[requesterOrgId] && Array.isArray(aiOrgs[requesterOrgId].roster)) {
        aiOrgs[requesterOrgId] = { ...aiOrgs[requesterOrgId], roster: _updateRoster(aiOrgs[requesterOrgId].roster, 'A') };
        s = { ...s, aiOrgs };
      }
      // 相手陣 = player roster
      s = { ...s, roster: _updateRoster(s.roster || [], 'B') };
    } else {
      // 打診者陣 = player roster
      s = { ...s, roster: _updateRoster(s.roster || [], 'A') };
      // 相手陣 = AI org
      const aiOrgs = { ...(s.aiOrgs || {}) };
      if (aiOrgs[opponentOrgId] && Array.isArray(aiOrgs[opponentOrgId].roster)) {
        aiOrgs[opponentOrgId] = { ...aiOrgs[opponentOrgId], roster: _updateRoster(aiOrgs[opponentOrgId].roster, 'B') };
        s = { ...s, aiOrgs };
      }
    }

    // 業界ニュース（プレイヤー視点で勝/敗/分を判定。score は常に「ourOrg-opponentOrg」表記に揃える）
    const ourOrgLabel = s.orgName || 'プレイヤー団体';
    let newsType, scoreStr;
    if (isInverse) {
      // inverse: 打診者=AI、相手=player。player の勝敗は teamWin === 'B'
      newsType = teamWinSide === 'B' ? 'challengeRequestInverseDefend'
        : teamWinSide === 'A' ? 'challengeRequestInverseFall'
        : 'challengeRequestInverseDraw';
      scoreStr = `${result.winsB}-${result.winsA}`;
    } else {
      newsType = teamWinSide === 'A' ? 'challengeRequestWin'
        : teamWinSide === 'B' ? 'challengeRequestLose'
        : 'challengeRequestDraw';
      scoreStr = `${result.winsA}-${result.winsB}`;
    }
    s = Engine.industryNews.push(s, {
      type: newsType,
      characterId: card.requesterId,
      data: {
        requesterName: card.teamA[0].name,
        opponentName: card.teamB[0].name,
        opponentOrg: isInverse ? card.requesterOrgName : card.otherOrgName,
        ourOrg: ourOrgLabel,
        score: scoreStr,
      },
    });

    // firing-grudge-spec-v0.1 Phase 4: 相手陣に「grudge.vsOrgId='player' / intensity≥60 / 解雇から24週以内」
    // のキャラが居れば firedReturn ニュースを追加発信
    const nowAbs = Engine.util && Engine.util.absWeek ? Engine.util.absWeek(s.season, s.week) : ((s.season - 1) * 20 + s.week);
    for (const oppFighter of card.teamB) {
      const g = oppFighter && oppFighter.grudge;
      if (!g || g.vsOrgId !== 'player') continue;
      if (!g.intensity || g.intensity < 60) continue;
      const firedAbs = ((g.issuedSeason || 1) - 1) * 20 + (g.issuedWeek || 1);
      const weeksSinceFired = nowAbs - firedAbs;
      if (weeksSinceFired > 24 || weeksSinceFired < 0) continue;
      s = Engine.industryNews.push(s, {
        type: 'firedReturn',
        characterId: oppFighter.id,
        data: {
          name: oppFighter.name,
          ourOrg: s.orgName || 'プレイヤー団体',
          toOrg: card.otherOrgName,
          weeksSinceFired: String(weeksSinceFired),
        },
      });
    }

    return s;
  },

  // h2h.history に積む meta フラグを構築（B-3 / 派閥抗争 / ロッカー荒廃 / 奪還）
  _buildMatchMeta(state, idA, idB, isReclaim) {
    const meta = {};
    // betrayal: B-3 元同僚 離脱後初対面
    if (Engine.orgTimeline && typeof Engine.orgTimeline.checkFirstMeetSinceDeparture === 'function') {
      try { if (Engine.orgTimeline.checkFirstMeetSinceDeparture(state, idA, idB)) meta.betrayal = true; } catch (_) {}
    }
    // factionWar: 同団体内で別派閥所属、両派閥が hostility 状態
    if (Engine.factions && typeof Engine.factions.getFactionByFighterId === 'function') {
      try {
        const fA = Engine.factions.getFactionByFighterId(state, idA);
        const fB = Engine.factions.getFactionByFighterId(state, idB);
        if (fA && fB && fA.id !== fB.id && (fA.inHostility || fB.inHostility)) {
          meta.factionWar = true;
        }
      } catch (_) {}
    }
    // lockerStress: _lockerCrisisWeek が直近4週以内
    if (state._lockerCrisisWeek != null && Engine.util && typeof Engine.util.absWeek === 'function') {
      const aw = Engine.util.absWeek(state.season, state.week);
      if (aw - state._lockerCrisisWeek <= 4) meta.lockerStress = true;
    }
    // reclaim: 奪還挑戦試合
    if (isReclaim) meta.reclaim = true;
    return meta;
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
    App.checkSurvivalUpdate();
    App.checkTitleEstablishment(); App.checkRosterCapMilestones();
    App.checkPrologueHighlights();
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
    // orgPop リバランス v1.1 §7: シーズン開始時のorgPop変動通知
    if (G._pendingSeasonStartNotif) {
      const notif = G._pendingSeasonStartNotif;
      const { _pendingSeasonStartNotif: _, ...cleanG } = G;
      G = cleanG;
      if (notif.decay > 0) {
        const nowPop = Math.round(notif.nowPop * 10) / 10;
        setTimeout(() => showToast(`📣 オフシーズンで団体人気が -${notif.decay} 減衰しました（現在: ${nowPop}）`, 6000), 800);
      }
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
    App.checkSurvivalUpdate();
    App.checkTitleEstablishment(); App.checkRosterCapMilestones();
    App.checkPrologueHighlights();
    // v1.5s25b: 週次バフ消費（weekly_funds適用含む）
    App._applyWeeklyBuffEffects();
    App._tickMilestoneBuffsWeekly();
    // v1.4w: ティッカー更新
    App._refreshTicker();
    // relationship-flags-spec-v1.0 §4: 関係性フラグモーダルを順次 popup に流す
    if (typeof _drainFlagModalQueue === 'function') _drainFlagModalQueue();
    // Common-3 派閥加入通知を順次表示
    App._drainFactionJoinNotices();
    // §6 アーキタイプ遷移ナレーション（F07 rebuke 4 累積など週次処理で発生する）
    App._drainArchetypeTransitions();
    // v0.96: Detect new injuries and show popups
    const newInjuries = G.roster.filter(c => c.injury && !oldRoster.find(o => o.id === c.id)?.injured);
    newInjuries.forEach((c, i) => {
      setTimeout(() => showEventPopup({ type:'fighter', id:c.id, name:c.name, tone:'negative',
        message: getTraitQuote('injury', c), detail:`🏥 ${c.injury.type} — 全治${c.injury.weeksLeft}週間` }), i * 100);
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
        // 団体年代記: アーカイブ + 気風寄与
        G = Engine.chronicle.archiveFighter(G, retiredF);
        G = Engine.chronicle.applySpiritContribution(G, retiredF);
        G = Engine.chronicle.refreshChapters(G);
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

    // 社長室 Phase 7: trainer/camp の信頼度遅延発現ミニ通知 (1件/週)
    // camp は全員分の reveal が同週に発生するため、perWeekDelta 降順で1件だけピック
    // (スポットライトは巡る原則)
    const weekTrustReveals = G._pendingTrustReveals || [];
    if (G._pendingTrustReveals) {
      const { _pendingTrustReveals: _, ...cleanTr } = G;
      G = cleanTr;
    }
    if (weekTrustReveals.length > 0) {
      const pick = [...weekTrustReveals].sort((a, b) => b.perWeekDelta - a.perWeekDelta)[0];
      const SOURCE_TEXTS = {
        trainer: '専属トレーナーとの練習で',
        camp: '合宿の手応えで',
      };
      const prefix = SOURCE_TEXTS[pick.source] || '';
      const msg = `🤝 ${prefix}${pick.fighterName}の気持ちが前向きになってきた`;
      const baseDelayTr = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 600;
      setTimeout(() => showToast(msg, 5000), baseDelayTr);
    }

    // ★ 成長マイルストーン通知
    const pendingMilestone = G._pendingMilestone || null;
    if (G._pendingMilestone) {
      const { _pendingMilestone: _, ...cleanMs } = G;
      G = cleanMs;
    }
    if (pendingMilestone) {
      const msF = G.roster.find(c => c.id === pendingMilestone.fighterId);
      if (msF) {
        const msLine = pickDialogueLine(MILESTONE_LINES[pendingMilestone.linePool], msF);
        const STAT_JA = { pw: 'パワー', sp: 'スピード', te: 'テクニック', st: 'スタミナ', mn: 'メンタル' };
        let msLabel;
        if (pendingMilestone.type === 'ovr') msLabel = `総合力${pendingMilestone.value}到達`;
        else if (pendingMilestone.type === 'pop') msLabel = `人気${pendingMilestone.value}到達`;
        else msLabel = `${STAT_JA[pendingMilestone.stat] || pendingMilestone.stat}が限界に到達`;
        // growthLogにマイルストーン記録
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

    // Phase 3a: 派閥イベント表示（F01/F02/F03 モーダル）
    // 大型イベント（B1〜B4）と同週に衝突した場合は、派閥モーダルを翌週以降に持ち越す。
    // _pendingFactionEvent を G に残しておけば、次週の tickWeek 派閥パイプラインが
    // pending 検知で新規抽選をスキップし（src/management.js:7456）、次週の表示ループで
    // 自然にモーダル化される。重複トリガーは発生しない。
    const pendingFactionEvent = G._pendingFactionEvent || null;
    if (pendingFactionEvent && !pendingLargeEvent) {
      const { _pendingFactionEvent: _, ...cleanFe } = G;
      G = cleanFe;
      const factionDelay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 650;
      setTimeout(() => App.handleFactionEvent(pendingFactionEvent), factionDelay);
    }

    // challenge-request-spec-v0.1 Phase 2: 挑戦試合直訴モーダル表示
    // 大型イベント・派閥イベントと衝突した場合は持ち越し（pendingThisWeek を残す）
    const crPending = (G.challengeRequest && G.challengeRequest.pendingThisWeek) || null;
    if (crPending && !pendingLargeEvent && !pendingFactionEvent) {
      const crDelay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 700;
      setTimeout(() => App.handleChallengeRequest(crPending), crDelay);
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
        setTimeout(() => { showGlimpseCascade(tier1); }, glimpseDelay);
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
    // v0.97: Update survival gauge
    App.checkSurvivalUpdate();
    App.checkTitleEstablishment(); App.checkRosterCapMilestones();
    App.checkPrologueHighlights();
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

    Storage.autoSave();
    Audio.bgm.playForState(); // BGM: switch on season transitions

    // v1.3-3: Show retirement popups (season-end)
    // 引退は引き留めダイアログで決断後に commit する（ダイアログ前は roster/titles/HoF を変更しない）
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

    // 受賞歴をキャリア記録に追加（プレイヤー団体・NPC団体ともに）
    {
      const aSeason = pendingAwards.season || G.season;
      const aWeek = 49; // オフシーズン表彰式

      // 任意の選手プールに対して id 一致で addEvent するヘルパー
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

      // ── プレイヤー団体ぶんのグローバル受賞 ──
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

      // ── NPC団体ごとの内部表彰（プレイヤーには表示されないが履歴には残る） ──
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
      App.restoreBgmForState(1600);
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
        case 'venue':
          if (evt.trigger.timing === 'preShow') break; // preShowフックで処理
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

  // D層: 興行前マイルストーンチェック（preShow timing のみ対象）
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

  // v1.5s25b: マイルストーンチェック→UI→適用のフロー
  _checkAndShowMilestone(onDone) {
    const evt = App._checkMilestones();
    if (!evt) { onDone(); return; }
    // D層イベント（choices なし）はセレモニー演出
    if (!evt.choices || evt.choices.length === 0) {
      G = { ...G, milestones: { ...(G.milestones || {}), [evt.id]: true } };
      const speakers = App._resolveSpotlightFighters(G);
      showCeremonyEvent(evt, speakers, onDone);
      return;
    }
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

  // D層: メインイベント2名 + ロスターpop最大のベテラン代表を選出
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
      mainLeft  ? { fighter: mainLeft,  roleLabel: 'MAIN EVENT ・ 赤コーナー' } : null,
      mainRight ? { fighter: mainRight, roleLabel: 'MAIN EVENT ・ 青コーナー' } : null,
      veteran   ? { fighter: veteran,   roleLabel: 'VETERAN ・ ロッカールーム代表' } : null
    ].filter(Boolean);
  },

  // D層: personality×archetypeからドームセリフを決定論的に選出（RNGシード利用）
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
      // 結果リアクション（吹き出し）取得 — E1 などで成功/推薦された選手のセリフを表示
      let resultReaction = null;
      try {
        if (Engine.eventSystem && typeof Engine.eventSystem.getChoiceResultDialogue === 'function') {
          const reactRng = Engine.rng.create(Engine.rng.derive((G.rngSeed || 1), (G.season || 0), (G.week || 0), 0xC401, choiceIdx));
          resultReaction = Engine.eventSystem.getChoiceResultDialogue(
            reactRng, event, choiceIdx, G.roster || [], result.recommendedAltId);
        }
      } catch (_) { /* 失敗時は吹き出しなしで続行 */ }
      showChoiceEventResult(event, displayEvents, G, { reaction: resultReaction });
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

      // B4タレント活動 / メディア密着取材: 選手選択後にセリフポップアップ表示
      // choiceIdx は選んだ選手ID(>0)。getLargeEventDialogue は event.activityType を見て
      // B4_{activityType} キーを内部で解決するため、type 上書きは不要。
      if (event.type === 'B4' && choiceIdx > 0) {
        const selectedFighter = G.roster.find(f => f.id === choiceIdx);
        if (selectedFighter) {
          const dlgRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB4D1));
          const dlgEvent = { ...event, fighter: choiceIdx };
          let dialogue = Engine.eventSystem.getLargeEventDialogue(dlgRng, dlgEvent, G.roster);
          // フォールバック: activityType 別キーで取れなかった場合は素の B4 を試す
          if (!dialogue && event.activityType) {
            dialogue = Engine.eventSystem.getLargeEventDialogue(dlgRng, { ...event, fighter: choiceIdx, activityType: undefined }, G.roster);
          }
          if (!dialogue) dialogue = '…精一杯やります';
          const activityLabel = (typeof TALENT_ACTIVITY_LABELS !== 'undefined' && event.activityType)
            ? (TALENT_ACTIVITY_LABELS[event.activityType] || 'タレント活動')
            : '密着取材';
          // closeAndChoice 直後の overlay クローズ完了を確実にしてから表示
          setTimeout(() => showEventPopup({
            type: 'fighter', id: selectedFighter.id, name: selectedFighter.name,
            tone: 'gold', message: dialogue,
            detail: `📺 ${event.outletName || 'メディア'}・${activityLabel}`,
          }), 250);
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

  // challenge-request-spec-v0.1 Phase 2: 挑戦試合打診UIフロー
  // YES → CD/クォータ更新 + （Phase 3 で団体戦カード挿入）
  // NO  → CD延長 + 打診者 condition 一時悪化 + ティッカーセリフ
  handleChallengeRequest(payload) {
    if (!payload) return;
    if (typeof showChallengeRequestModal !== 'function') {
      // フォールバック: モーダル未読込時はクリアだけ
      G = Engine.challengeRequest.rejectPending(G);
      return;
    }
    const isInverse = !!payload._inverse;
    // 打診者の lookup helper（forward = player roster / inverse = AI org roster）
    const _findRequester = () => {
      if (isInverse) {
        const reqOrg = G.aiOrgs && G.aiOrgs[payload.requesterOrgId];
        return reqOrg && reqOrg.roster ? (reqOrg.roster.find(c => c.id === payload.selfId) || {}) : {};
      }
      return G.roster.find(c => c.id === payload.selfId) || {};
    };
    showChallengeRequestModal(payload, G, (choice) => {
      if (choice === 'YES') {
        const reqName = _findRequester().name || '';
        // 試合カード生成（味方/相手陣が足りなければ却下扱い）
        const card = Engine.challengeRequest.buildMatchCard(G);
        if (!card) {
          G = Engine.challengeRequest.rejectPending(G);
          Storage.autoSave();
          Audio.play('error');
          renderWeekScreen && renderWeekScreen();
          showToast(`${reqName} の直訴を受けたが、メンバー編成が整わず実現できなかった。`);
          return;
        }
        // クォータ・CD更新
        G = Engine.challengeRequest.acceptPending(G);
        // 試合実行
        const matchRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, payload.selfId, payload.otherId, 0xCA110));
        const result = Engine.challengeRequest.resolveMatchCard(card, matchRng);
        // h2h / career / news 反映
        G = App._applyChallengeRequestResult(G, card, result);
        Storage.autoSave();
        Audio.play('event');
        // 結果モーダル表示
        if (typeof showChallengeRequestResultModal === 'function') {
          showChallengeRequestResultModal(card, result, G, () => {
            renderWeekScreen && renderWeekScreen();
          });
        } else {
          renderWeekScreen && renderWeekScreen();
          const scoreLabel = `${result.winsA}-${result.winsB}`;
          const tw = result.teamWin === 'A' ? '勝利' : (result.teamWin === 'B' ? '敗北' : '引き分け');
          showToast(`挑戦試合 ${scoreLabel}（${tw}）— ${reqName} の直訴試合が決着。`);
        }
      } else if (choice === 'NO') {
        G = Engine.challengeRequest.rejectPending(G);
        // 打診者の condition 一時悪化（次戦のパフォーマンスとセリフに反映）
        // forward: player roster の打診者 / inverse: AI org の打診者（AI 側の condition を悪化）
        if (isInverse) {
          const aiOrgs = { ...(G.aiOrgs || {}) };
          const reqOrg = aiOrgs[payload.requesterOrgId];
          if (reqOrg && Array.isArray(reqOrg.roster)) {
            const newAiRoster = reqOrg.roster.map(f =>
              f.id === payload.selfId
                ? { ...f, condition: Math.max(0, (f.condition != null ? f.condition : 70) - 8) }
                : f
            );
            aiOrgs[payload.requesterOrgId] = { ...reqOrg, roster: newAiRoster };
            G = { ...G, aiOrgs };
          }
        } else {
          const idx = (G.roster || []).findIndex(f => f.id === payload.selfId);
          if (idx >= 0) {
            const f = G.roster[idx];
            const newCondition = Math.max(0, (f.condition != null ? f.condition : 70) - 8);
            const newRoster = [...G.roster];
            newRoster[idx] = { ...f, condition: newCondition };
            G = { ...G, roster: newRoster };
          }
        }
        Storage.autoSave();
        Audio.play('click');
        renderWeekScreen && renderWeekScreen();
        const requester = _findRequester();
        const reqName = requester.name || '';
        // 性格別ティッカーセリフ（CHALLENGE_REQUEST_NO_LINES から1行抽選）
        let noLine = `${reqName} の直訴を見送った。`;
        if (typeof CHALLENGE_REQUEST_NO_LINES !== 'undefined') {
          const pers = requester.personality || 'normal';
          const arr = CHALLENGE_REQUEST_NO_LINES[pers] || CHALLENGE_REQUEST_NO_LINES.normal;
          if (arr && arr.length > 0) {
            const lineRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, payload.selfId, 0xC4A2));
            const line = arr[Engine.rng.int(lineRng, 0, arr.length - 1)];
            noLine = `${reqName}: 「${line}」`;
          }
        }
        showToast(noLine);
      } else {
        // null / unknown → 何もしない（pendingThisWeek 残置で次週に持ち越し）
      }
    });
  },

  // Phase 3a: 派閥イベントUIフロー制御（F01/F02/F03）
  handleFactionEvent(event) {
    const { eventId, payload } = event;
    // 結果モーダル「閉じる」時に stinger + BGM fadeOut + 通常 BGM 復帰
    const finalizeAudio = () => _factionAudioClose(eventId);
    if (eventId === 'F01') {
      _factionAudioOpen(eventId);
      showFactionF01Modal(payload, G, (choiceId) => {
        if (!choiceId) return;
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFA13));
        const result = Engine.factions.applyF01Choice(G, payload, choiceId, rng);
        G = { ...result.state };
        // 業界ニュース: 派閥成立（A=旗揚げ, C=静観で結成）
        if (choiceId === 'A' || choiceId === 'C') {
          App._pushIndustryNews({
            type: 'factionFormed',
            characterId: payload.leaderId,
            data: { org: G.orgName || 'プレイヤー団体', leaderName: payload.leaderName || '?' },
          });
        }
        Storage.autoSave();
        Audio.play('event');
        renderWeekScreen();
        const leader = (G.roster || []).find(c => c.id === payload.leaderId);
        showFactionEventResult({
          eventId: 'F01',
          category: '派閥成立',
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
        // 業界ニュース: 派閥抗争勃発（A=煽る / C=介入しない で抗争表面化）
        if (choiceId === 'A' || choiceId === 'C') {
          App._pushIndustryNews({
            type: 'factionEscalation',
            characterId: payload.leaderAId || null,
            data: {
              org: G.orgName || 'プレイヤー団体',
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
          category: '派閥抗争',
          resultText: result.resultText,
          charId: payload.leaderAId,
          charName: leaderA ? leaderA.name : payload.leaderAName,
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
        }, finalizeAudio);
      });
    } else if (eventId === 'F02_PEACE') {
      // v4 §2-1: F02② 沈静化（通知のみ・選択肢なし）
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
          category: '抗争沈静化',
          resultText: result.resultText,
          factionName: payload.factionAName || payload.factionBName || '派閥',
          factionTone: 'allied',
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
          state: G,
        }, finalizeAudio);
      });
    } else if (eventId === 'F02_IGNITE') {
      // v4 §2-1: F02① 発火（興行開始時、通知のみ・選択肢なし）
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
          category: '抗争発火',
          resultText: result.resultText,
          factionName: payload.factionAName || payload.factionBName || '派閥',
          factionTone: 'hostile',
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
          state: G,
        }, finalizeAudio);
      });
    } else if (eventId === 'F02_RESOLUTION') {
      // v4 §2-1: F02③ 決着（試合直後、通知のみ・選択肢なし）
      _factionAudioOpen(eventId);
      showFactionF02ResolutionModal(payload, G, () => {
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFA24));
        const result = Engine.factions.applyF02ResolutionResult(G, payload, rng);
        G = { ...result.state };
        // 業界ニュース: 派閥抗争決着
        App._pushIndustryNews({
          type: 'factionResolution',
          characterId: payload.winnerId || null,
          data: {
            org: G.orgName || 'プレイヤー団体',
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
          category: '抗争決着',
          resultText: result.resultText,
          charId: payload.winnerId,
          charName: winner ? winner.name : payload.winnerName,
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
        }, finalizeAudio);
      });
    } else if (eventId === 'F02_ENDLESS') {
      // v4 §2-1: F02④ 無限抗争（通知のみ・選択肢なし）
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
          category: '無限抗争',
          resultText: result.resultText,
          factionName: payload.factionAName || payload.factionBName || '派閥',
          factionTone: 'hostile',
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
          state: G,
        }, finalizeAudio);
      });
    } else if (eventId === 'F03') {
      _factionAudioOpen(eventId);
      showFactionF03Modal(payload, G, () => {
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFA33));
        const result = Engine.factions.applyF03Result(G, payload, rng);
        G = { ...result.state };
        // 業界ニュース: 派閥消滅 (branch === 'dissolution' / 後継者なし)
        if (payload.branch === 'dissolution') {
          const fac = (G.factions || []).find(f => f.id === payload.factionId);
          App._pushIndustryNews({
            type: 'factionDissolution',
            characterId: null,
            data: {
              org: G.orgName || 'プレイヤー団体',
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
          category: 'リーダー喪失',
          resultText: result.resultText,
          charId: payload.newLeaderId || null,
          charName: newLeader ? newLeader.name : (payload.newLeaderName || ''),
          factionName: payload.factionName || '',
          factionTone: 'neutral',
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
          state: G,
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
          category: '移籍',
          resultText: result.resultText,
          charId: payload.targetId,
          charName: target ? target.name : payload.targetName,
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
        }, finalizeAudio);
      });
    } else if (eventId === 'F05H') {
      // F05H 活動休止（通知のみ・選択肢なし）
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
          category: '活動休止',
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
        // 業界ニュース: 派閥分裂（A=放任 で natural split が発生する経路想定）
        if (choiceId === 'A' || choiceId === 'C') {
          App._pushIndustryNews({
            type: 'factionSplit',
            characterId: payload.ringleaderId || null,
            data: {
              org: G.orgName || 'プレイヤー団体',
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
          category: '派閥分裂',
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
          category: '同盟締結',
          resultText: result.resultText,
          charId: payload.leaderAId || null,
          charName: leader6 ? leader6.name : payload.leaderAName,
          factionName: payload.factionAName || payload.factionBName || '',
          factionTone: 'allied',
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
          state: G,
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
        // v0.4 新シグネチャ: incidentType × choice × personality でリーダー反応セリフを構成
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
          category: '派閥動向',
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
          category: '直接対決',
          resultText: result.resultText,
          charId: payload.leaderAId || null,
          charName: leader8 ? leader8.name : payload.leaderAName,
          factionName: payload.factionAName || payload.factionBName || '',
          factionTone: 'hostile',
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
          state: G,
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
        if (result.pendingMatch && choiceId === 'A') {
          // ビッグマッチとして実試合へ遷移
          const fA = (G.roster || []).find(c => c.id === payload.fighterAId);
          const fB = (G.roster || []).find(c => c.id === payload.fighterBId);
          if (!fA || !fB) { finalizeAudio && finalizeAudio(); return; }
          App._common1Preview = {
            payload, fighterA: fA, fighterB: fB,
            watching: false, matchResult: null, finalizeAudio
          };
          if (typeof _renderCommon1MatchPreview === 'function') {
            _renderCommon1MatchPreview(payload, fA, fB);
          }
          return;
        }
        const leader = (G.roster || []).find(c => c.id === payload.leaderId);
        showFactionEventResult({
          eventId: 'COMMON_1',
          category: '派閥内対決',
          resultText: result.resultText,
          charId: payload.leaderId || null,
          charName: leader ? leader.name : '',
          factionName: payload.factionName || '',
          factionTone: 'neutral',
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
          state: G,
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
          category: 'メディア取材',
          resultText: result.resultText,
          charId: payload.leaderId || null,
          charName: leader ? leader.name : payload.leaderName,
          factionName: payload.factionName || '',
          factionTone: 'neutral',
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
          state: G,
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
          category: '派閥合同企画',
          resultText: result.resultText,
          charId: payload.leaderAId || null,
          charName: leaderA ? leaderA.name : payload.leaderAName,
          factionName: payload.factionAName || payload.factionBName || '',
          factionTone: 'allied',
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
          state: G,
        }, finalizeAudio);
      });
    } else if (eventId === 'COMMON_4') {
      // 派閥合宿・慰労会（通知のみ・選択肢なし）
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
          category: '派閥合宿',
          resultText: result.resultText,
          charId: payload.leaderId || null,
          charName: leader ? leader.name : payload.leaderName,
          factionName: payload.factionName || '',
          factionTone: 'neutral',
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
          state: G,
        }, finalizeAudio);
      });
    }
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
    // Replay: 結果事前計算 (skip と同 seed: 0xB1B4)
    const b3Rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB1B4));
    const b3Result = Engine.battle.simulateMatch({ ...pf, condition: 80 }, { ...af, condition: 80 }, b3Rng, 2, { recordFrames: true });
    b3._preResult = b3Result;
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
        vl: App._buildVlVsPlayerForExEmployee(af, G.season, G.week),
        vsExHit: App._buildVsExHitLines(af, G.season, G.week)
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
      },
      result: b3Result,
    };
    try { Audio.fileBgm.play('../bgm/iwashiro_elevate_perfect.ogg', { loop: true, volume: 0.12 }); } catch(e) {}
    let sent = false;
    const sendOnce = () => { if (sent) return; sent = true; iframe.contentWindow.postMessage(msg, '*'); };
    iframe.onload = () => setTimeout(sendOnce, 200);
    // singles系は必ず battle-engine.html（タッグ観戦で tag-battle.html に切替わっていても戻す）
    iframe.src = 'battle-engine.html?t=' + Date.now();
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
    // Replay: 事前計算結果を正とする
    const matchResult = b3._preResult || {
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

  // ── Common-1 派閥内対決: ビッグマッチ実試合フロー ──
  common1WatchMatch() {
    const c1 = App._common1Preview;
    if (!c1) return;
    c1.watching = true;
    const overlay = document.getElementById('battleOverlay');
    overlay.style.display = 'block';
    const escBtn = document.getElementById('battleEscapeBtn');
    if (escBtn) { escBtn.style.opacity = '0'; escBtn.style.pointerEvents = 'none'; }
    clearTimeout(App._escBtnTimer);
    App._escBtnTimer = setTimeout(() => { if (escBtn) { escBtn.style.opacity = '1'; escBtn.style.pointerEvents = 'auto'; } }, 8000);

    const fA = c1.fighterA, fB = c1.fighterB;
    const c1Rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xC0F1));
    const c1Result = Engine.battle.simulateMatch({ ...fA, condition: 80 }, { ...fB, condition: 80 }, c1Rng, 2, { recordFrames: true });
    c1._preResult = c1Result;
    const iframe = document.getElementById('battleIframe');
    const factionName = c1.payload.factionName || '派閥';
    const msg = {
      type: 'START_MATCH',
      left: {
        ...fA, condition: 80,
        portraitUrl: getPortraitUrl(fA.id), profile: CHAR_PROFILES[fA.id] || '',
        vl: fA.voiceLines || fA.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[fA.id]) || ['…！']
      },
      right: {
        ...fB, condition: 80,
        portraitUrl: getPortraitUrl(fB.id), profile: CHAR_PROFILES[fB.id] || '',
        vl: fB.voiceLines || fB.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[fB.id]) || ['…！']
      },
      matchInfo: {
        header: `⚔ ${factionName} 派閥内対決`,
        subHeader: `${fA.name} vs ${fB.name}`,
        matchNum: 1, totalMatches: 1,
        isTitle: false, isSpecialMatch: true, matchTier: 2,
        rivalryTier: (() => { const rl = Engine.title.getRivalryLevel(G, fA.id, fB.id); return rl ? rl.tier : 0; })(),
        leftPersonality: fA.personality || 'normal', leftArchetype: fA.archetype || 'normal',
        rightPersonality: fB.personality || 'normal', rightArchetype: fB.archetype || 'normal',
        sfxMasterVol: Audio.sfxMasterVol, bgmMasterVol: Audio.bgmMasterVol,
      },
      result: c1Result,
    };
    try { Audio.fileBgm.play('../bgm/iwashiro_elevate_perfect.ogg', { loop: true, volume: 0.12 }); } catch(e) {}
    let sent = false;
    const sendOnce = () => { if (sent) return; sent = true; iframe.contentWindow.postMessage(msg, '*'); };
    iframe.onload = () => setTimeout(sendOnce, 200);
    iframe.src = 'battle-engine.html?t=' + Date.now();
    setTimeout(sendOnce, 800);
  },

  common1SkipMatch() {
    const c1 = App._common1Preview;
    if (!c1) return;
    const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xC0F1));
    const matchResult = Engine.battle.simulateMatch(c1.fighterA, c1.fighterB, rng, 2);
    c1.matchResult = matchResult;
    App._finalizeCommon1Match(matchResult);
  },

  _receiveCommon1BattleResult(data) {
    const c1 = App._common1Preview;
    if (!c1) return;
    c1.watching = false;
    const matchResult = c1._preResult || {
      winner: data.winner,
      finType: data.finType || '', finMove: data.finMove || '',
      turns: data.turns || 0, mq: data.mq || 50,
      hpLeft: { final: data.hpLeft ? data.hpLeft.current : 0, max: data.hpLeft ? data.hpLeft.max : 100 },
      hpRight: { final: data.hpRight ? data.hpRight.current : 0, max: data.hpRight ? data.hpRight.max : 100 },
      log: data.log || []
    };
    c1.matchResult = matchResult;
    try { Audio.fileBgm.fadeOut(1500); } catch(e) {}
    document.getElementById('battleOverlay').style.display = 'none';
    Audio.play('coin');
    App._finalizeCommon1Match(matchResult);
  },

  _finalizeCommon1Match(matchResult) {
    const c1 = App._common1Preview;
    if (!c1) return;
    const { payload, fighterA, fighterB, finalizeAudio } = c1;
    const winnerId = matchResult.winner === 'left' ? fighterA.id : fighterB.id;
    const loserId  = matchResult.winner === 'left' ? fighterB.id : fighterA.id;

    // 因縁・関係性の正規パイプライン（同団体ペア）
    if (G.relationships) {
      const c1RelRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xC0FE));
      const c1Context = {
        mq: matchResult.mq,
        winner: matchResult.winner === 'left' ? 'win' : (matchResult.winner === 'right' ? 'lose' : 'draw'),
        hpA: matchResult.hpLeft, hpB: matchResult.hpRight,
        turns: matchResult.turns,
        stage: 'normal', isTitleMatch: false, rivalryResolved: false, injuredId: null,
        isCareerBestA: matchResult.mq > (fighterA.careerBestMQ || 0),
        isCareerBestB: matchResult.mq > (fighterB.careerBestMQ || 0),
        losingStreakA: fighterA.losingStreak || 0, losingStreakB: fighterB.losingStreak || 0,
        ovrA: Engine.util.ov(fighterA), ovrB: Engine.util.ov(fighterB),
        isCrossOrg: false,
      };
      G = Engine.relationships.applyMatchResult(G, fighterA.id, fighterB.id, c1Context, c1RelRng);
    }

    // Common1 専用 trust/rivalry 反映
    const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xC0FA));
    const result = Engine.factions.applyCommon1MatchResult(G, payload, winnerId, loserId, rng);
    G = { ...result.state };
    Storage.autoSave();
    renderWeekScreen();

    setTimeout(() => {
      _renderCommon1MatchResult(payload, matchResult, fighterA, fighterB, result, () => {
        App._common1Preview = null;
        App.restoreBgmForState && App.restoreBgmForState();
        if (finalizeAudio) finalizeAudio();
      });
    }, 300);
  },

  // B3: 結果画面を閉じる
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
    // Replay: 結果事前計算 (skip と同 seed: 0xB1B4)
    const b2Rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB1B4));
    const b2Result = Engine.battle.simulateMatch({ ...f1, condition: 80 }, { ...f2, condition: 80 }, b2Rng, 2, { recordFrames: true });
    b2._preResult = b2Result;
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
      },
      result: b2Result,
    };
    try { Audio.fileBgm.play('../bgm/iwashiro_elevate_perfect.ogg', { loop: true, volume: 0.12 }); } catch(e) {}
    let sent = false;
    const sendOnce = () => { if (sent) return; sent = true; iframe.contentWindow.postMessage(msg, '*'); };
    iframe.onload = () => setTimeout(sendOnce, 200);
    // singles系は必ず battle-engine.html（タッグ観戦で tag-battle.html に切替わっていても戻す）
    iframe.src = 'battle-engine.html?t=' + Date.now();
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
    // Replay: 事前計算結果を正とする
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
    App.restoreBgmForState();
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
    // MVPレース v2: B3 辞退時の AI挑戦者への履歴追加など
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

  // 社長室 Phase 5: 選手ポップアップから「声をかける」(encourage)
  // 決裁枠も資金も消費しない。社長自らが足を運ぶ自発的行動。
  // 発動条件: slump/motivationLoss 中 OR 信頼が揺らぎ始めた(trust<50)
  // UI 側で 2段階の温度感(is-urgent: slump/motivLoss/trust<40, is-gentle: trust<50)
  encourageFighter(fighterId) {
    const target = G.roster.find(f => f.id === fighterId);
    if (!target) { showToast('選手が見つかりません'); return; }
    if (target.isRental || target.injury) { showToast('今は声をかけられない'); return; }
    const targetTrust = target.trust != null ? target.trust : 50;
    if (!target.slump && !target.motivationLoss && targetTrust >= 50) {
      showToast('この選手には今、声をかける理由がない');
      return;
    }
    // cooldown チェック(選手単位、1週)
    const lastUsed = (target._decisionWeekUsed || {}).encourage || -99;
    if ((G.week - lastUsed) < 1) { showToast('今週はもう声をかけた'); return; }

    // Engine.shachoshitsu.execute を再利用(決裁枠0の書類なので dp 消費なし)
    const result = Engine.shachoshitsu.execute('encourage', fighterId, G);
    if (!result || result.error) {
      const msg = {
        doc_not_found: 'この行動は現在利用できません',
        fighter_not_found: '選手が見つかりません',
        not_needed: 'この選手には今、声をかける理由がない',
        not_slump: 'この選手には今、声をかける理由がない',  // 旧エラーIDの互換
        cooldown: '今週はもう声をかけた',
        condition_not_met: '声をかける状況ではない',
        funds_insufficient: '資金が不足しています',
      }[result?.error] || '失敗しました';
      showToast(msg);
      return;
    }

    // state 更新(encourage は decisionPoints を消費しないが、execute 側で
    // newDp を返すので一応反映。実質 0 引かれている)
    G = { ...G,
      roster: result.roster,
      funds: result.funds,
      decisionPoints: result.decisionPoints != null ? result.decisionPoints : G.decisionPoints,
      _decisionWeekUsed: result._decisionWeekUsed || G._decisionWeekUsed || {},
      gameLog: [...(G.gameLog || []), ...(result.events || [])],
    };
    if (result.relationships) G = { ...G, relationships: result.relationships };
    Storage.autoSave();

    // 選手ポップアップを閉じてから結果モーダルを出す(ドラマ演出)
    if (typeof closeFighterPopup === 'function') closeFighterPopup();

    // displayData を組み立てて既存の豪華モーダルに流す
    const doc = Engine.shachoshitsu.getDoc('encourage');
    const reactionKey = result.reactionKey || 'encourage';
    const fighter = G.roster.find(f => f.id === fighterId);
    const text = fighter ? Engine.shachoshitsu.getReactionText(reactionKey, fighter) : '';
    const displayData = {
      fighter, text,
      changes: result.changes || [],
      cost: result.cost || 0,
      remainingFunds: result.funds,
      icon: doc?.icon || '💬',
      label: doc?.label || '声かけ',
      docId: 'encourage',
      // Phase 8: 不確実性トーンマーカー (encourage も個人書類)
      reactionTone: result.reactionTone || null,
    };
    Audio.play('notify');
    if (typeof showDecisionResultModal === 'function') {
      showDecisionResultModal(displayData);
    }
    if (typeof refreshAll === 'function') refreshAll();
  },

  // 社長室 Phase 5: 特別治療(怪我ポップアップの二次アクション)
  // 決裁枠は消費せず、資金200万のみ消費。回復期間を1〜4週短縮。
  executeSpecialTreatment(fighterId) {
    const result = Engine.shachoshitsu.executeSpecialTreatment(fighterId, G);
    if (!result) { showToast('特別治療に失敗しました'); return; }
    if (result.error === 'funds_insufficient') { showToast('資金が不足しています'); return; }
    if (result.error === 'fighter_not_found') { showToast('選手が見つかりません'); return; }
    if (result.error === 'not_injured') { showToast('怪我をしていない選手には使用できません'); return; }
    // state 更新
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

    // 選手反応モーダル(社長室の通常書類と同じ豪華モーダルに流す)
    const fighter = G.roster.find(f => f.id === fighterId);
    if (fighter && typeof showDecisionResultModal === 'function') {
      const text = Engine.shachoshitsu.getReactionText('special_treatment', fighter);
      const doc = Engine.shachoshitsu.getDoc('special_treatment');
      const displayData = {
        fighter, text,
        changes: result.changes || [],
        cost: result.cost || 0,
        remainingFunds: result.funds,
        icon: doc?.icon || '🏥',
        label: doc?.label || '特別治療指示書',
        docId: 'special_treatment',
      };
      showDecisionResultModal(displayData);
    } else {
      showToast(`🏥 ${result.cur}週 → ${result.reduced}週に短縮（-${result.cost}万）`);
    }
    if (typeof renderWeekScreen === 'function') renderWeekScreen();
  },

  // 社長室 Phase 4: 書類クリックハンドラ(モーダル分岐)
  onShachoshitsuDocClick(docId) {
    Audio.play('click');
    // 決裁済みなら無視
    if ((G._decisionDoneThisWeek || []).includes(docId)) return;
    const doc = Engine.shachoshitsu.getDoc(docId);
    if (!doc) return;
    // 事前チェック(UX: モーダルを開く前にはじく)
    const dpCost = doc.decisionCost || 0;
    if ((G.decisionPoints || 0) < dpCost) {
      showToast(`決裁枠が不足しています(必要: ⚡${dpCost})`);
      return;
    }
    const actualCost = Engine.shachoshitsu.calcCost(doc, G);
    if ((G.funds || 0) < actualCost) {
      showToast(`資金が不足しています(必要: ${actualCost}万)`);
      return;
    }
    // 個人書類 / 団体書類 / ペア書類 で分岐
    if (doc.effect && doc.effect.target === 'team') {
      showDecisionConfirmModal(docId, G);
    } else if (doc.effect && doc.effect.target === 'pair') {
      showDecisionPairModal(docId, G);
    } else {
      showDecisionTargetModal(docId, G);
    }
  },

  // 社長室 Phase 4: 決裁実行エントリポイント
  // fighterId: 個人書類のとき対象選手ID、team書類のとき null
  // 返り値: { ok: true, displayData } | { ok: false, error? }
  executeDecision(docId, fighterId) {
    const result = Engine.shachoshitsu.execute(docId, fighterId, G);
    if (!result) { showToast('書類が見つかりません'); return { ok: false }; }
    if (result.error === 'doc_not_found') { showToast('書類が見つかりません'); return { ok: false }; }
    if (result.error === 'decision_points_insufficient') { showToast('決裁枠が不足しています'); return { ok: false }; }
    if (result.error === 'funds_insufficient') { showToast('資金が不足しています'); return { ok: false }; }
    if (result.error === 'fighter_not_found') { showToast('選手が見つかりません'); return { ok: false }; }
    if (result.error === 'not_slump') { showToast('スランプ中の選手ではありません'); return { ok: false }; }
    if (result.error === 'not_injured') { showToast('怪我をしていない選手には使用できません'); return { ok: false }; }
    if (result.error === 'cooldown') { showToast('今週はすでに決裁済みです'); return { ok: false }; }
    if (result.error === 'orgpop_locked') { showToast(`団体の知名度が足りません(${result.required} 必要)`); return { ok: false }; }
    if (result.error === 'condition_not_met') { showToast('この書類の発動条件を満たしていません'); return { ok: false }; }
    if (result.error === 'unsupported_doc') { showToast(`未対応の書類です: ${result.docId}`); return { ok: false }; }

    // state 更新
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
    // 業界ニュース: relationship_repair などが積んだイベントを反映
    if (result._industryNewsEvents && result._industryNewsEvents.length > 0) {
      G = { ...G, _industryNewsEvents: [...(G._industryNewsEvents || []), ...result._industryNewsEvents] };
    }
    Storage.autoSave();

    // displayData 構築(結果表示用)
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
          // Phase 8: 不確実性トーンマーカー (個人書類のみ)
          reactionTone: result.reactionTone || null,
        };
      }
    } else {
      // 団体書類(party/camp): 参加者全員 + 代表セリフ + camp フレーバー
      const participants = (G.roster || []).filter(f => !f.isRental && !f.injury);
      const repFighter = participants.length > 0
        ? participants[Math.floor(Math.random() * participants.length)]
        : null;
      const text = repFighter ? Engine.shachoshitsu.getReactionText(reactionKey, repFighter) : '';
      // camp: CAMP_FLAVOR_TEXTS からランダムに1件、参加者2名を差し込み
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

    // サウンド(コスト別、既存流用)
    // Phase 9: 朱印音を先に鳴らす(0.6秒の朱印アニメと同時開始)
    // 合成音の短いバーストなので、後続のコスト別サウンドとぶつからない
    Audio.play('stamp');
    const soundCost = result.cost || 0;
    if (docId === 'camp') Audio.play('fanfare');
    else if (soundCost >= 160) Audio.play('award');
    else if (soundCost >= 80) Audio.play('event');
    else Audio.play('notify');

    // 演出フック: 書類DOMに朱印アニメ(is-approving)を付与 → 0.6秒後に再レンダ(is-approved に切替)
    // HUDの最初の「立っている」hankoに falling クラスを付与
    try {
      const docEl = document.querySelector(`.shachoshitsu-doc[data-doc-id="${docId}"]`);
      if (docEl) docEl.classList.add('is-approving');
      const firstStandingHanko = document.querySelector('.shachoshitsu-hud .hanko.available:not(.falling)');
      if (firstStandingHanko) firstStandingHanko.classList.add('falling');
    } catch (e) {}

    // 結果表示: 個人/team 問わず常に豪華モーダル(話者の顔+セリフ+変化+コスト)
    // spec: 決裁=特別な行為、キャラの反応を覗き見る体験を一貫させる
    if (typeof showDecisionResultModal === 'function') {
      showDecisionResultModal(displayData);
    } else if (typeof showDecisionResultToast === 'function') {
      showDecisionResultToast(displayData);
    }

    // 0.6秒後に再レンダリングして決裁済み状態(is-approved)を反映
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

  // 序章ハイライト発火チェック (Phase 3)
  // 状態ベース: 既に発火済みのIDは Engine.prologue.addHighlight 内で重複ガードされる。
  // status === 'in_progress' のときのみ刻まれる(addHighlight 側ガード)。
  checkPrologueHighlights() {
    if (!G.prologue || G.prologue.status !== 'in_progress') return;
    const totalShows = G.totalShows || 0;
    const orgPop = G.orgPop || 0;
    const bestMQ = G.seasonStats?.bestMQ || 0;
    const histBest = (G.seasonHistory || []).reduce((m, s) => Math.max(m, s.bestMQ || 0), 0);
    const peakMQ = Math.max(bestMQ, histBest);
    const champId = G.titles?.world?.championId;
    const titleEstablished = !!G.titleEstablished;

    const triggers = [];
    if (totalShows >= 1) triggers.push({ id:'first_show', tier:'gold',
      text:`旗揚げ戦。最初の興行が開かれ、団体は始動した。` });
    if (titleEstablished) triggers.push({ id:'first_title_setup', tier:'normal',
      text:`団体王座の設立が認定された。` });
    if (champId) {
      const ch = G.roster.find(c => c.id === champId);
      const chName = ch?.name || '初代王者';
      triggers.push({ id:'first_title_winner', tier:'red',
        text:`${chName}が初代王者に。最初の頂が決まった。` });
    }
    if (peakMQ >= 50) triggers.push({ id:'first_mq50', tier:'silver', text:`MQ50到達。観客の目つきが変わり始めた。` });
    if (peakMQ >= 70) triggers.push({ id:'first_mq70', tier:'silver', text:`MQ70到達。名勝負と呼ぶに値する試合が出た。` });
    if (peakMQ >= 80) triggers.push({ id:'first_mq80', tier:'gold', text:`MQ80到達。この章の選手が業界の壁を叩いた瞬間。` });
    if (orgPop >= 25) triggers.push({ id:'pop_25', tier:'normal', text:`団体人気25到達。スポンサー筋に動きが出始めた。` });
    if (orgPop >= 50) triggers.push({ id:'pop_50', tier:'silver', text:`団体人気50到達。大会場での興行が現実的に。` });
    if (G.survivalCleared) triggers.push({ id:'survival_clear', tier:'red',
      text:`経営安定化達成。月次黒字が定着し、団体存続の目処が立った。` });

    // founder の引退検出 (id ベース冪等)
    (G.prologue.founderIds || []).forEach(fid => {
      if (Engine.prologue.founderState(G, fid) !== 'retired') return;
      const archive = (G.chronicle?.fighterArchive || []).find(a => a.id === fid);
      const retired = (G.retiredFighters || []).find(f => f.id === fid);
      const name = archive?.name || retired?.name || '';
      triggers.push({
        id: `founder_first_retire_${fid}`,
        tier: 'red',
        text: `旗揚げメンバー ${name} が引退。`,
      });
    });

    triggers.forEach(t => { G = Engine.prologue.addHighlight(G, t); });

    // 全 founder 引退で序章確定 (idempotent)
    G = Engine.prologue.checkAndConfirm(G);
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

    // Replay: 結果事前計算 (skip と一致させるため同じ seed を使う)
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
      victoryLine: _getWarVictoryLine(warWinnerFighter, G),
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
        vl: pf.voiceLines || pf.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[pf.id]) || ['…！']
      },
      right: {
        ...af, condition: 80,
        portraitUrl: getPortraitUrl(af.id), profile: CHAR_PROFILES[af.id] || '',
        vl: App._buildVlVsPlayerForExEmployee(af, G.season, G.week),
        vsExHit: App._buildVsExHitLines(af, G.season, G.week)
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
      },
      result: warResult,
    };
    // ビッグマッチBGM（対抗戦）
    try { Audio.fileBgm.play('../bgm/iwashiro_elevate_perfect.ogg', { loop: true, volume: 0.12 }); } catch(e) {}
    let sent = false;
    const sendOnce = () => {
      if (sent) return; sent = true;
      iframe.contentWindow.postMessage(msg, '*');
    };
    iframe.onload = () => setTimeout(sendOnce, 200);
    // singles系は必ず battle-engine.html（タッグ観戦で tag-battle.html に切替わっていても戻す）
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
      victoryLine: _getWarVictoryLine(winnerFighter, G),
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
        victoryLine: _getWarVictoryLine(winnerFighter, G),
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
    // Replay 移行: watchMatch で結果は既に格納済み (整合性確保のため)。overlay を閉じて次へ遷移。
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
      const oppName = matchResult ? matchResult.aiFighter?.name : undefined;
      return Engine.career.addEvent(c, { type: 'war', season: G.season, week: G.week, opponentOrg: ev.opponentName, opponentName: oppName, won: matchResult ? matchResult.playerWon : false });
    }) };

    // AI側の対抗戦出場選手にもcareer event記録
    const aiOrgId = ev.opponentOrgId;
    if (G.aiOrgs && G.aiOrgs[aiOrgId]) {
      const aiWarIds = new Set(wp.card.map(m => m.aiFighter.id));
      const updatedAiRoster = G.aiOrgs[aiOrgId].roster.map(c => {
        if (!aiWarIds.has(c.id)) return c;
        const matchResult = wp.results.find(r => r.aiFighter.id === c.id);
        const oppName = matchResult ? matchResult.playerFighter?.name : undefined;
        return Engine.career.addEvent(c, { type: 'war', season: G.season, week: G.week, opponentOrg: G.orgName || 'プレイヤー団体', opponentName: oppName, won: matchResult ? !matchResult.playerWon : false });
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
      const warMeta = App._buildMatchMeta(G, r.playerFighter.id, r.aiFighter.id, false);
      warH2h = Engine.h2h.update(warH2h, r.playerFighter.id, r.aiFighter.id, winner, r.mq, false, false, G.season, G.week, 'war', 'player', ev.opponentOrgId, warMeta);
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

    // ── v4 §2-1: F02③ 決着 判定（対抗戦） ──
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

  // Replay: 結果事前計算 (skip と同 seed)
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
      vl: App._buildVlVsPlayerForExEmployee(match.left, G.season, G.week),
      vsExHit: App._buildVsExHitLines(match.left, G.season, G.week)
    },
    right: {
      ...match.right, condition: 80,
      portraitUrl: getPortraitUrl(match.right.id), profile: CHAR_PROFILES[match.right.id] || '',
      vl: App._buildVlVsPlayerForExEmployee(match.right, G.season, G.week),
      vsExHit: App._buildVsExHitLines(match.right, G.season, G.week)
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
    },
    result: ppvResult,
  };
  // ビッグマッチBGM（PPV）
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
  // Replay 移行: 事前計算済みなら結果を維持し overlay を閉じて次へ
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
      const sp = pp.summitPair;
      // 自団体所属を厳密判定。player不在のTVモードでは playerInvolved=false
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

      // 団体名（プレイヤー側 / 相手側）
      const orgNameOf = (orgId) => orgId === 'player' ? (G.orgName || 'プレイヤー団体') : (G.aiOrgs?.[orgId]?.name || '相手団体');
      const playerOrgName = playerInvolved ? (G.orgName || 'プレイヤー団体')
        : orgNameOf(sp.org1Id);
      const aiOrgId = playerInvolved
        ? (sp.org1Id === 'player' ? sp.org2Id : sp.org1Id)
        : sp.org2Id;
      const aiOrgName = orgNameOf(aiOrgId);

      // ランキング
      const rankings = G.rankings || [];
      const playerOrgIdLookup = playerInvolved ? 'player' : sp.org1Id;
      const playerRank = (rankings.find(r => r.orgId === playerOrgIdLookup) || {}).rank || null;
      const aiRank = (rankings.find(r => r.orgId === aiOrgId) || {}).rank || null;

      // h2h（更新前なのでprior）
      const priorH2h = playerF && aiF ? Engine.h2h.getRecordFor(G, playerF.id, aiF.id) : null;

      // HP残量
      const winnerSide = sr.winner;
      const winnerHpFinal = winnerSide === 'left' ? (sr.hpLeft?.final ?? 0) : (sr.hpRight?.final ?? 0);
      const winnerHpMax = winnerSide === 'left' ? (sr.hpLeft?.max ?? 100) : (sr.hpRight?.max ?? 100);
      const loserHpFinal = winnerSide === 'left' ? (sr.hpRight?.final ?? 0) : (sr.hpLeft?.final ?? 0);
      const loserHpMax = winnerSide === 'left' ? (sr.hpRight?.max ?? 100) : (sr.hpLeft?.max ?? 100);

      // 勝者セリフ（自団体勝利時のみ、PPV_SUMMIT_VICTORY_LINESから1本）
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
        opponentName: aiOrgName, // 後方互換
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

  // 新聞用: PPVアンダーカード結果を蓄積（業界ニュース欄用、サミット以外の上位MQ3件）
  {
    const orgNameOfU = (orgId) => orgId === 'player' ? (G.orgName || 'プレイヤー団体') : (G.aiOrgs?.[orgId]?.name || '相手団体');
    const undercards = [];
    pp.results.forEach((r, idx) => {
      const match = pp.card[idx];
      if (match.isSummit) return;
      const winnerSide = r.winner;
      if (winnerSide !== 'left' && winnerSide !== 'right') return; // 引き分けは除外
      const winnerF = winnerSide === 'left' ? match.left : match.right;
      const loserF = winnerSide === 'left' ? match.right : match.left;
      undercards.push({
        winnerName: winnerF.name,
        winnerId: winnerF.id,
        winnerOrgName: orgNameOfU(winnerF._ppvOrgId),
        winnerOrgId: winnerF._ppvOrgId,
        loserName: loserF.name,
        loserId: loserF.id,
        loserOrgName: orgNameOfU(loserF._ppvOrgId),
        loserOrgId: loserF._ppvOrgId,
        mq: r.mq || 0,
        finType: r.finType || '',
        finMove: r.finMove || '',
        turns: r.turns || 0,
        isTitleMatch: !!match.isTitleMatch,
      });
    });
    undercards.sort((a, b) => b.mq - a.mq);
    s._newsPpvUndercards = undercards.slice(0, 3);
  }

  // recentMatches記録（PPV）
  let ppvRoster = [...(s.roster || G.roster)];
  pp.results.forEach((r, idx) => {
    const match = pp.card[idx];
    ppvRoster = Engine.pushRecentMatch(ppvRoster, match.left.id, match.right.id, r.winner, s.season, s.week);
  });
  s = { ...s, roster: ppvRoster };

  // h2h記録: PPV（合同興行のため各選手の所属を判定）
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
      setTimeout(() => { showGlimpseCascade(tier1); }, 500);
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

  _chainEventPopupQueueEmpty(() => {
    renderPPVTVResult(tvResult.card, tvResult.results, G.ppvName);
  });

  showEventPopup({
    type: 'system',
    emoji: '📺',
    tone: 'gold',
    name: G.ppvName || 'PPV GRAND FINAL',
    message: 'ついに年間総決算のPPV当日です。あと一歩届かず、私たちの名前は今夜のカードにありません。悔しさはありますが、まずは他団体の大一番をテレビで確認しましょう。'
  });
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
      setTimeout(() => { showGlimpseCascade(tier1); }, 500);
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
  // Replay: 事前シミュ済みの match から frames+winner 等を result として組み立てる
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
    result: jtResult,
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
  iframe.src = 'battle-engine.html?t=' + Date.now();
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
  // BGMフェードアウト（決勝時）
  try { Audio.fileBgm.fadeOut(1500); } catch(e) {}
  // iframeを閉じる
  document.getElementById('battleOverlay').style.display = 'none';

  // iframe結果でmatch dataを上書き（iframe独自シミュレーションの結果を正とする）
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
    // 最終ラウンドだった場合、champion/runnerUpだけ更新
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

      // フル選手データを取得してシミュレーション
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
    G = { ...G, weekPhase: 'manage' };
    App.restoreBgmForState();
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
