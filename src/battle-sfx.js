// battle-sfx.js — 観戦画面 (single / tag) 共通SFX層
// 単品の battle-engine.html / tag-battle.html の両方から <script src="battle-sfx.js"></script> で読み込む。
// どちらの画面で audio 周りを改修しても両方に自動反映されることが目的。
// グローバル依存: clamp(v,lo,hi), matchData (victoryFanfare で matchInfo.isSpecialMatch を参照)

let ac=null;
function ctx(){
  if(!ac)ac=new(window.AudioContext||window.webkitAudioContext)();
  if(ac&&ac.state==='suspended'){
    try{ac.resume().catch(()=>{});}catch(e){}
  }
  return ac
}
let _sfxMasterGain=null,_bgmMasterGain=null,_sfxGain=null;
function _ensureMasterGains(){
  if(!_sfxMasterGain){const c=ctx();
    _sfxMasterGain=c.createGain();_sfxMasterGain.gain.value=1;_sfxMasterGain.connect(c.destination);
    _bgmMasterGain=c.createGain();_bgmMasterGain.gain.value=1;_bgmMasterGain.connect(c.destination);
  }
}
function getSfxGain(){if(!_sfxGain){_ensureMasterGains();const c=ctx();_sfxGain=c.createGain();_sfxGain.gain.value=1;_sfxGain.connect(_sfxMasterGain);}return _sfxGain;}

const _SE_FILES={
  hitStrike:'../bgm/b01_strike_hit_v4.mp3',
  hitThrow:'../bgm/b02_throw_hit_v1.mp3',
  hitSub:'../bgm/b03_joint_v4.mp3',
  hitAerial:'../bgm/b12_bigmove_hit_v3.mp3',
  hitGround:'../bgm/b03_joint_v5.mp3',
  hitRollup:'../bgm/b06_rollup_v1.mp3',
  missWhiff:'../bgm/b07_whiff_v4.mp3',
  counterSE:'../bgm/b08_counter_v1.mp3',
  cutinSlide:'../bgm/b09_cutin_slide_v6.mp3',
  bigmoveCharge:'../bgm/b11_charge_v2.mp3',
  bigmoveImpact:'../bgm/b12_bigmove_hit_v2.mp3',
  kickoutSE:'../bgm/f02_kickout_v2.mp3',
  guEscapeSE:'../bgm/f03_escape_v2.mp3',
  heartbeatSE:'../bgm/f04_heartbeat_v1.mp3',
  finImpact:'../bgm/f05_finish_impact_v2.mp3',
  ready:'../bgm/f11_ready_v1.mp3',
  fightStart:'../bgm/f12_fight_start_v3.mp3',
  lockIn:'../bgm/f13_lockup_v4.mp3',
};
const SE_MIX={
  hitStrike:.50,hitThrow:.53,hitSub:.20,hitAerial:.10,hitGround:.13,hitRollup:.50,
  missWhiff:.24,counterSE:.15,cutinSlide:.40,dmgVoice:.45,bigmoveCharge:.21,bigmoveImpact:.41,
  count:1.00,kickoutSE:.39,guEscapeSE:.22,heartbeatSE:.55,finImpact:.36,finChime:.50,
  gong:.55,gongStart:.55,phaseChg:.73,victoryFanfare:.50,ready:.29,fightStart:.10,lockIn:.35,
};
function _playSample(name,scale,rawVol){
  const url=_SE_FILES[name];if(!url)return false;
  try{
    const a=new Audio(url);
    const smv=_sfxMasterGain?_sfxMasterGain.gain.value:1;
    let vol;
    if(rawVol!=null){vol=smv*rawVol;}
    else {const mix=SE_MIX[name]||0.5;const s=scale!=null?Math.max(0.6,Math.min(1.15,0.4+scale*0.5)):1;vol=smv*mix*s;}
    a.volume=Math.min(1,vol);a.play().catch(()=>{});return true;
  }catch(e){return false}
}
function mkNoise(dur,g){try{const c=ctx(),b=c.createBuffer(1,c.sampleRate*dur,c.sampleRate),
  ch=b.getChannelData(0);for(let i=0;i<ch.length;i++)ch[i]=Math.random()*2-1;
  const s=c.createBufferSource();s.buffer=b;const gn=c.createGain();
  gn.gain.setValueAtTime(g,c.currentTime);gn.gain.exponentialRampToValueAtTime(0.001,c.currentTime+dur);
  s.connect(gn).connect(getSfxGain());s.start();s.stop(c.currentTime+dur)}catch(e){}}
function mkNoiseHP(dur,g,hpFreq){try{const c=ctx(),b=c.createBuffer(1,c.sampleRate*dur,c.sampleRate),
  ch=b.getChannelData(0);for(let i=0;i<ch.length;i++)ch[i]=Math.random()*2-1;
  const s=c.createBufferSource();s.buffer=b;const gn=c.createGain();
  gn.gain.setValueAtTime(g,c.currentTime);gn.gain.exponentialRampToValueAtTime(0.001,c.currentTime+dur);
  const hp=c.createBiquadFilter();hp.type='highpass';hp.frequency.value=hpFreq;
  s.connect(hp).connect(gn).connect(getSfxGain());s.start();s.stop(c.currentTime+dur)}catch(e){}}
function mkNoiseLP(dur,g,lpFreq){try{const c=ctx(),b=c.createBuffer(1,c.sampleRate*dur,c.sampleRate),
  ch=b.getChannelData(0);for(let i=0;i<ch.length;i++)ch[i]=Math.random()*2-1;
  const s=c.createBufferSource();s.buffer=b;const gn=c.createGain();
  gn.gain.setValueAtTime(g,c.currentTime);gn.gain.exponentialRampToValueAtTime(0.001,c.currentTime+dur);
  const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=lpFreq;
  s.connect(lp).connect(gn).connect(getSfxGain());s.start();s.stop(c.currentTime+dur)}catch(e){}}
function osc(type,freq,freqEnd,dur,gain){try{const c=ctx(),o=c.createOscillator(),g=c.createGain();
  o.type=type;o.frequency.setValueAtTime(freq,c.currentTime);
  if(freqEnd)o.frequency.exponentialRampToValueAtTime(freqEnd,c.currentTime+dur);
  g.gain.setValueAtTime(gain,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+dur);
  o.connect(g).connect(getSfxGain());o.start();o.stop(c.currentTime+dur)}catch(e){}}
function bellP(freq,dur,gain){try{const c=ctx(),o=c.createOscillator(),g=c.createGain();
  o.type='sine';o.frequency.setValueAtTime(freq,c.currentTime);
  g.gain.setValueAtTime(gain,c.currentTime);g.gain.setTargetAtTime(0.001,c.currentTime,dur*0.35);
  o.connect(g).connect(getSfxGain());o.start();o.stop(c.currentTime+dur*1.2)}catch(e){}}

const sfx={
  // UI (single menu専用)
  hover(){osc('sine',1200,1800,0.06,0.05)},
  select(){try{const c=ctx();[1047,1319,1568,2093,2637].forEach((f,i)=>{setTimeout(()=>{
    const o=c.createOscillator(),g=c.createGain();o.type='sine';
    o.frequency.setValueAtTime(f,c.currentTime);
    const vib=c.createOscillator();vib.type='sine';vib.frequency.value=6;
    const vibG=c.createGain();vibG.gain.value=3;vib.connect(vibG).connect(o.frequency);vib.start();
    g.gain.setValueAtTime(0.07,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.3);
    o.connect(g).connect(getSfxGain());o.start();o.stop(c.currentTime+0.3);vib.stop(c.currentTime+0.3)
  },i*20)})}catch(e){}},
  deselect(){osc('sine',900,400,0.12,0.05)},
  lockIn(){try{getSfxGain().gain.value=SE_MIX.lockIn;if(_playSample('lockIn',1))return;const c=ctx();osc('sine',100,50,0.08,0.08);
    setTimeout(()=>{[523,659,784,988,1047,1319,1568].forEach((f,i)=>{setTimeout(()=>{
      const o=c.createOscillator(),g=c.createGain();o.type='sine';
      o.frequency.setValueAtTime(f,c.currentTime);
      const vib=c.createOscillator();vib.type='sine';vib.frequency.value=5;
      const vibG=c.createGain();vibG.gain.value=4;vib.connect(vibG).connect(o.frequency);vib.start();
      g.gain.setValueAtTime(0.06,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.6);
      o.connect(g).connect(getSfxGain());o.start();o.stop(c.currentTime+0.6);vib.stop(c.currentTime+0.6)
    },i*30)})},50);setTimeout(()=>mkNoiseHP(0.5,0.04,3000),300);setTimeout(()=>osc('sine',80,40,0.4,0.03),500);
  }catch(e){}},
  fightStart(){try{getSfxGain().gain.value=SE_MIX.fightStart;if(_playSample('fightStart',1))return;[0,30,60,90,120,150].forEach((t,i)=>setTimeout(()=>osc('sine',60,30,0.04,0.08+i*0.014),t));
    setTimeout(()=>osc('sine',150,3000,0.4,0.12),200);
    setTimeout(()=>{mkNoise(0.2,0.2);[262,330,392,523,659,784,1047].forEach(f=>{osc('sine',f,null,0.6,0.15);osc('sine',f*2,null,0.3,0.03)})},650);
    setTimeout(()=>osc('sine',50,25,0.8,0.06),850);
  }catch(e){}},
  ready(){getSfxGain().gain.value=SE_MIX.ready;if(_playSample('ready',1))return;osc('sine',200,500,0.12,0.06);setTimeout(()=>osc('triangle',500,null,0.06,0.03),80)},
  missWhiff(){getSfxGain().gain.value=SE_MIX.missWhiff;if(_playSample('missWhiff',1))return;osc('sine',400,100,0.15,0.1);mkNoiseHP(0.08,0.06,3000);setTimeout(()=>osc('triangle',200,80,0.1,0.05),100)},
  hitStrike(dr,vm){const m=SE_MIX.hitStrike*(vm||1);getSfxGain().gain.value=m;if(_playSample('hitStrike',Math.min(1.5,dr),vm?m:undefined))return;const g=0.12*dr,d=0.08*(0.8+dr*0.4);mkNoise(d,g);osc('sine',2000,800,0.05*d/0.08,0.1*dr)},
  hitThrow(dr,vm){const m=SE_MIX.hitThrow*(vm||1);getSfxGain().gain.value=m;if(_playSample('hitThrow',Math.min(1.5,dr),vm?m:undefined))return;const g=0.1*dr,d=0.12*(0.8+dr*0.4);mkNoise(d,g);osc('sine',120,60,0.15*d/0.12,0.12*dr)},
  hitSub(dr,vm){const m=SE_MIX.hitSub*(vm||1);getSfxGain().gain.value=m;_playSample('hitSub',Math.min(1.5,dr),vm?m:undefined)},
  hitAerial(dr,vm){const m=SE_MIX.hitAerial*(vm||1);getSfxGain().gain.value=m;if(_playSample('hitAerial',Math.min(1.5,dr),vm?m:undefined))return;const g=0.08*dr,d=0.15*(0.8+dr*0.4);osc('sine',1500,300,d,g);setTimeout(()=>{mkNoise(0.15*dr,0.12*dr);osc('sine',100,50,0.2,0.12*dr)},150)},
  hitGround(dr,vm){const m=SE_MIX.hitGround*(vm||1);getSfxGain().gain.value=m;if(_playSample('hitGround',Math.min(1.5,dr),vm?m:undefined))return;const g=0.08*dr,d=0.12*(0.8+dr*0.4);mkNoise(d,g);osc('sawtooth',180,80,d,0.09*dr)},
  hitRollup(dr,vm){const m=SE_MIX.hitRollup*(vm||1);getSfxGain().gain.value=m;if(_playSample('hitRollup',Math.min(1.5,0.5*dr),vm?m:undefined))return;osc('triangle',2000,600,0.06,0.08*dr)},
  cutinSlide(){try{getSfxGain().gain.value=SE_MIX.cutinSlide;if(_playSample('cutinSlide',1))return;osc('sine',300,800,0.08,0.06);mkNoiseHP(0.03,0.04,4000)}catch(e){}},
  dmgVoice(){try{getSfxGain().gain.value=SE_MIX.dmgVoice;osc('sine',200,80,0.2,0.06);mkNoiseLP(0.08,0.05,800)}catch(e){}},
  bigmoveCharge(){try{getSfxGain().gain.value=SE_MIX.bigmoveCharge;if(_playSample('bigmoveCharge',1))return;osc('sine',60,200,1.6,0.08);osc('sawtooth',60,180,1.6,0.03);setTimeout(()=>mkNoiseHP(0.3,0.04,3000),800);setTimeout(()=>osc('sine',150,400,0.3,0.06),1200)}catch(e){}},
  bigmoveImpact(){try{getSfxGain().gain.value=SE_MIX.bigmoveImpact;if(_playSample('bigmoveImpact',1))return;osc('sine',100,25,0.4,0.25);mkNoise(0.15,0.25);mkNoiseLP(0.25,0.15,300);osc('triangle',60,20,0.3,0.12);setTimeout(()=>mkNoiseHP(0.05,0.08,5000),50)}catch(e){}},
  counterSE(){try{getSfxGain().gain.value=SE_MIX.counterSE;if(_playSample('counterSE',1))return;mkNoise(0.12,0.3);osc('sine',150,40,0.2,0.2);mkNoiseLP(0.15,0.2,500);osc('square',800,200,0.08,0.12);setTimeout(()=>{mkNoiseHP(0.08,0.15,3000);osc('sine',60,30,0.15,0.1)},60)}catch(e){}},
  missSE(){osc('sine',400,200,0.1,0.04)},
  kickout(){osc('square',200,800,0.1,0.1);mkNoise(0.15,0.08)},
  kickoutSE(){try{getSfxGain().gain.value=SE_MIX.kickoutSE;if(_playSample('kickoutSE',1))return;mkNoise(0.2,0.12);osc('sine',100,60,0.15,0.1);setTimeout(()=>mkNoiseHP(0.3,0.06,2000),100)}catch(e){}},
  guEscapeSE(){try{getSfxGain().gain.value=SE_MIX.guEscapeSE;if(_playSample('guEscapeSE',1))return;osc('sawtooth',80,200,0.2,0.1);mkNoiseHP(0.3,0.08,1500);setTimeout(()=>mkNoiseHP(0.4,0.05,2500),150)}catch(e){}},
  heartbeatSE(){try{getSfxGain().gain.value=SE_MIX.heartbeatSE;if(_playSample('heartbeatSE',1))return;osc('sine',50,30,0.3,0.12);setTimeout(()=>osc('sine',50,30,0.3,0.12),400)}catch(e){}},
  count(){try{getSfxGain().gain.value=SE_MIX.count;osc('sine',100,40,0.12,0.15);mkNoiseLP(0.05,0.1,400);osc('triangle',50,null,0.08,0.06)}catch(e){}},
  finImpact(){try{getSfxGain().gain.value=SE_MIX.finImpact;if(_playSample('finImpact',1))return;osc('sine',120,25,0.5,0.2);osc('triangle',80,20,0.4,0.1);mkNoise(0.1,0.2);mkNoiseLP(0.2,0.12,300);setTimeout(()=>osc('sine',40,null,0.5,0.08),100);mkNoiseHP(0.03,0.06,5000)}catch(e){}},
  finChime(){try{getSfxGain().gain.value=SE_MIX.finChime;const c=ctx();[523,659,784,1047].forEach((f,i)=>{setTimeout(()=>{
    const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(f,c.currentTime);
    const vib=c.createOscillator(),vibG=c.createGain();vib.type='sine';vib.frequency.value=5;vibG.gain.value=3;
    vib.connect(vibG).connect(o.frequency);vib.start();
    g.gain.setValueAtTime(0.1,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.6);
    o.connect(g).connect(getSfxGain());o.start();o.stop(c.currentTime+0.6);vib.stop(c.currentTime+0.6)
  },i*100)})}catch(e){}},
  gong(){try{getSfxGain().gain.value=SE_MIX.gong;const base=440;bellP(base*1.0,0.3,0.14);bellP(base*2.32,0.5,0.09);bellP(base*3.8,0.7,0.05);mkNoiseHP(0.02,0.06,5000)}catch(e){}},
  gongStart(){try{getSfxGain().gain.value=SE_MIX.gongStart;const base=440;bellP(base*1.0,0.5,0.2);bellP(base*2.32,0.7,0.13);bellP(base*3.8,0.9,0.07);mkNoiseHP(0.03,0.09,5000)}catch(e){}},
  bellx3(){[0,380,760].forEach(d=>setTimeout(()=>{try{sfx.gong()}catch(e){}},d))},
  phaseChg(){try{getSfxGain().gain.value=SE_MIX.phaseChg;osc('triangle',400,800,0.08,0.06);setTimeout(()=>{osc('sine',1000,null,0.12,0.06);mkNoiseHP(0.02,0.03,6000)},100)}catch(e){}},
  victoryFanfare(){try{
    const mi=(typeof matchData!=='undefined'&&matchData)?matchData.matchInfo:null;
    if(mi&&mi.isSpecialMatch){
      const a=new Audio('../bgm/f10_victory_fanfare_v8.mp3');
      const bmv=mi.bgmMasterVol!==undefined?mi.bgmMasterVol:1;
      a.volume=Math.min(1,bmv*0.29);a.play().catch(()=>{});return;
    }
    getSfxGain().gain.value=SE_MIX.victoryFanfare;const c=ctx();
    [0,60,120,180].forEach(t=>setTimeout(()=>osc('sine',60,30,0.08,0.15),t));
    setTimeout(()=>{[523,659,784,1047].forEach((f,i)=>setTimeout(()=>{
      osc('sawtooth',f,null,0.12,0.05);osc('sine',f,null,0.15,0.13);osc('sine',f*2,null,0.1,0.03)},i*80))},400);
    setTimeout(()=>{[523,659,784,988,1047,1319].forEach(f=>{
      const o2=c.createOscillator(),g2=c.createGain();o2.type='sine';
      o2.frequency.setValueAtTime(f,c.currentTime);
      g2.gain.setValueAtTime(0.16,c.currentTime);
      g2.gain.exponentialRampToValueAtTime(0.001,c.currentTime+1.2);
      o2.connect(g2).connect(getSfxGain());o2.start();o2.stop(c.currentTime+1.2)});mkNoise(0.3,0.03)},900);
    setTimeout(()=>{[2093,2637,3136].forEach((f,i)=>setTimeout(()=>osc('sine',f,null,0.25,0.07),i*100))},1500);
    setTimeout(()=>osc('sine',131,null,0.6,0.08),1800);
  }catch(e){}},
  // Tag-specific
  hotTagSE(){try{getSfxGain().gain.value=0.55;const c=ctx();[523,659,784,1047,1319].forEach((f,i)=>{setTimeout(()=>{const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(f,c.currentTime);g.gain.setValueAtTime(0.12,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.4);o.connect(g).connect(getSfxGain());o.start();o.stop(c.currentTime+0.4)},i*50)});mkNoiseHP(0.3,0.06,3000)}catch(e){}},
  doubleTeamSE(){try{getSfxGain().gain.value=0.45;mkNoise(0.2,0.28);osc('sine',80,30,0.4,0.2);mkNoiseLP(0.25,0.15,400);setTimeout(()=>{mkNoise(0.15,0.2);osc('sine',100,40,0.25,0.15)},180)}catch(e){}},
  touchSE(){try{getSfxGain().gain.value=0.35;osc('sine',600,1000,0.08,0.05);osc('triangle',400,null,0.1,0.04)}catch(e){}},
  betrayalSE(){try{getSfxGain().gain.value=0.35;osc('sawtooth',200,50,0.5,0.08);mkNoiseLP(0.4,0.06,300)}catch(e){}},
  friendlyFireSE(){try{getSfxGain().gain.value=0.35;osc('triangle',500,200,0.15,0.08);mkNoise(0.1,0.1)}catch(e){}},
};
function hitSE(cat,dmg,volMul){
  const dr=clamp(dmg/20,0.3,1.5);
  const fn={strike:sfx.hitStrike,throw:sfx.hitThrow,submission:sfx.hitSub,
    aerial:sfx.hitAerial,ground:sfx.hitGround,rollup:sfx.hitRollup}[cat];
  if(fn)fn(dr,volMul);else sfx.hitStrike(dr,volMul);
}
// Replay (tag) 側で frame.action.moveCat が無い場合のフォールバック推定
function guessCategory(moveName){
  if(!moveName)return 'strike';
  const n=moveName;
  if(/スープレックス|バスター|スラム|DDT|ネックブリーカー|ドロップ(?!キック)|ボム|ドライバー|パワーボム/.test(n))return 'throw';
  if(/ロック|固め|絞め|クラッチ(?!マン)|ホールド|ツイスト|クラブ|バー(?!スト)|STF|アキレス/.test(n))return 'submission';
  if(/フライング|ダイビング|ムーンサルト|スプラッシュ|トペ|セントーン|プランチャ|ボム$/.test(n))return 'aerial';
  if(/ドロップ$|ストンピング連打|ニードロップ|レッグドロップ|フェイスウォッシュ/.test(n))return 'ground';
  if(/エビ固め|クラッチ|スクールボーイ|ラ・マヒストラル|ウラカン・ラナ/.test(n))return 'rollup';
  return 'strike';
}

// ═══ SUSPENSE DRONE (single専用 — tag側は呼ばない) ═══
let _droneNodes=null;
function startDrone(){
  stopDrone();try{_ensureMasterGains();const c=ctx(),now=c.currentTime;
    const o1=c.createOscillator(),g1=c.createGain();o1.type='sine';o1.frequency.value=75;
    const lfo1=c.createOscillator(),lfoG1=c.createGain();lfo1.type='sine';lfo1.frequency.value=0.25;lfoG1.gain.value=10;
    lfo1.connect(lfoG1).connect(o1.frequency);lfo1.start(now);
    g1.gain.value=0.04;o1.connect(g1).connect(_bgmMasterGain);o1.start(now);
    const o2=c.createOscillator(),g2=c.createGain();o2.type='sine';o2.frequency.value=113;
    const lfo2=c.createOscillator(),lfoG2=c.createGain();lfo2.type='sine';lfo2.frequency.value=0.4;lfoG2.gain.value=12;
    lfo2.connect(lfoG2).connect(o2.frequency);lfo2.start(now);
    g2.gain.value=0.03;o2.connect(g2).connect(_bgmMasterGain);o2.start(now);
    const o3=c.createOscillator(),g3=c.createGain();o3.type='sine';o3.frequency.value=106;
    g3.gain.value=0.015;o3.connect(g3).connect(_bgmMasterGain);o3.start(now);
    _droneNodes={o1,g1,lfo1,o2,g2,lfo2,o3,g3};
  }catch(e){}}
function stopDrone(){if(!_droneNodes)return;try{const c=ctx(),now=c.currentTime,n=_droneNodes;
    [n.g1,n.g2,n.g3].forEach(g=>{if(g){g.gain.setValueAtTime(g.gain.value,now);g.gain.exponentialRampToValueAtTime(0.001,now+0.2)}});
    setTimeout(()=>{try{[n.o1,n.lfo1,n.o2,n.lfo2,n.o3].forEach(o=>{if(o)try{o.stop()}catch(e){}})}catch(e){}},250);
    _droneNodes=null;}catch(e){_droneNodes=null}}
