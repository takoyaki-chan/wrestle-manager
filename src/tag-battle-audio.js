// tag-battle audio — battle-engine.html から essential SE のみ抽出
let ac=null;
function ctx(){if(!ac)ac=new(window.AudioContext||window.webkitAudioContext)();return ac}
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
  bigmoveImpact:'../bgm/b12_bigmove_hit_v2.mp3',
  kickoutSE:'../bgm/f02_kickout_v2.mp3',
  heartbeatSE:'../bgm/f04_heartbeat_v1.mp3',
  finImpact:'../bgm/f05_finish_impact_v2.mp3',
  ready:'../bgm/f11_ready_v1.mp3',
  fightStart:'../bgm/f12_fight_start_v3.mp3',
};
const SE_MIX={
  hitStrike:.50,hitThrow:.53,hitSub:.20,hitAerial:.10,hitGround:.13,hitRollup:.50,
  missWhiff:.24,counterSE:.15,cutinSlide:.40,dmgVoice:.45,bigmoveImpact:.41,
  kickoutSE:.39,heartbeatSE:.55,finImpact:.36,finChime:.50,
  gong:.55,phaseChg:.73,victoryFanfare:.50,ready:.29,fightStart:.10,
  count:1.00,guEscapeSE:.22,
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
  missWhiff(){getSfxGain().gain.value=SE_MIX.missWhiff;if(_playSample('missWhiff',1))return;osc('sine',400,100,0.15,0.1);mkNoiseHP(0.08,0.06,3000)},
  hitStrike(dr,vm){const m=SE_MIX.hitStrike*(vm||1);getSfxGain().gain.value=m;if(_playSample('hitStrike',Math.min(1.5,dr),vm?m:undefined))return;mkNoise(0.08,0.12*dr);osc('sine',2000,800,0.05,0.1*dr)},
  hitThrow(dr,vm){const m=SE_MIX.hitThrow*(vm||1);getSfxGain().gain.value=m;if(_playSample('hitThrow',Math.min(1.5,dr),vm?m:undefined))return;mkNoise(0.12,0.1*dr);osc('sine',120,60,0.15,0.12*dr)},
  hitSub(dr,vm){const m=SE_MIX.hitSub*(vm||1);getSfxGain().gain.value=m;_playSample('hitSub',Math.min(1.5,dr),vm?m:undefined)},
  hitAerial(dr,vm){const m=SE_MIX.hitAerial*(vm||1);getSfxGain().gain.value=m;if(_playSample('hitAerial',Math.min(1.5,dr),vm?m:undefined))return;osc('sine',1500,300,0.15,0.08*dr);setTimeout(()=>{mkNoise(0.15*dr,0.12*dr);osc('sine',100,50,0.2,0.12*dr)},150)},
  hitGround(dr,vm){const m=SE_MIX.hitGround*(vm||1);getSfxGain().gain.value=m;if(_playSample('hitGround',Math.min(1.5,dr),vm?m:undefined))return;mkNoise(0.12,0.08*dr);osc('sawtooth',180,80,0.12,0.09*dr)},
  hitRollup(dr,vm){const m=SE_MIX.hitRollup*(vm||1);getSfxGain().gain.value=m;_playSample('hitRollup',Math.min(1.5,0.5*dr),vm?m:undefined)},
  counterSE(){try{getSfxGain().gain.value=SE_MIX.counterSE;if(_playSample('counterSE',1))return;mkNoise(0.12,0.3);osc('sine',150,40,0.2,0.2)}catch(e){}},
  cutinSlide(){try{getSfxGain().gain.value=SE_MIX.cutinSlide;if(_playSample('cutinSlide',1))return;osc('sine',300,800,0.08,0.06);mkNoiseHP(0.03,0.04,4000)}catch(e){}},
  dmgVoice(){try{getSfxGain().gain.value=SE_MIX.dmgVoice;osc('sine',200,80,0.2,0.06);mkNoiseLP(0.08,0.05,800)}catch(e){}},
  bigmoveImpact(){try{getSfxGain().gain.value=SE_MIX.bigmoveImpact;if(_playSample('bigmoveImpact',1))return;osc('sine',100,25,0.4,0.25);mkNoise(0.15,0.25);mkNoiseLP(0.25,0.15,300)}catch(e){}},
  kickoutSE(){try{getSfxGain().gain.value=SE_MIX.kickoutSE;if(_playSample('kickoutSE',1))return;mkNoise(0.2,0.12);osc('sine',100,60,0.15,0.1)}catch(e){}},
  heartbeatSE(){try{getSfxGain().gain.value=SE_MIX.heartbeatSE;if(_playSample('heartbeatSE',1))return;osc('sine',50,30,0.3,0.12);setTimeout(()=>osc('sine',50,30,0.3,0.12),400)}catch(e){}},
  finImpact(){try{getSfxGain().gain.value=SE_MIX.finImpact;if(_playSample('finImpact',1))return;osc('sine',120,25,0.5,0.2);mkNoise(0.1,0.2);mkNoiseLP(0.2,0.12,300)}catch(e){}},
  finChime(){try{getSfxGain().gain.value=SE_MIX.finChime;[523,659,784,1047].forEach((f,i)=>{setTimeout(()=>{const c=ctx(),o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(f,c.currentTime);g.gain.setValueAtTime(0.1,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.6);o.connect(g).connect(getSfxGain());o.start();o.stop(c.currentTime+0.6)},i*100)})}catch(e){}},
  gong(){try{getSfxGain().gain.value=SE_MIX.gong;const base=440;bellP(base*1.0,0.3,0.14);bellP(base*2.32,0.5,0.09);bellP(base*3.8,0.7,0.05);mkNoiseHP(0.02,0.06,5000)}catch(e){}},
  bellx3(){[0,380,760].forEach(d=>setTimeout(()=>{try{sfx.gong()}catch(e){}},d))},
  phaseChg(){try{getSfxGain().gain.value=SE_MIX.phaseChg;osc('triangle',400,800,0.08,0.06);setTimeout(()=>{osc('sine',1000,null,0.12,0.06);mkNoiseHP(0.02,0.03,6000)},100)}catch(e){}},
  victoryFanfare(){try{getSfxGain().gain.value=SE_MIX.victoryFanfare;
    [0,60,120,180].forEach(t=>setTimeout(()=>osc('sine',60,30,0.08,0.15),t));
    setTimeout(()=>{[523,659,784,1047].forEach((f,i)=>setTimeout(()=>{osc('sawtooth',f,null,0.12,0.05);osc('sine',f,null,0.15,0.13)},i*80))},400);
    setTimeout(()=>{[2093,2637,3136].forEach((f,i)=>setTimeout(()=>osc('sine',f,null,0.25,0.07),i*100))},1500);
  }catch(e){}},
  // Tag-specific
  hotTagSE(){try{getSfxGain().gain.value=0.55;const c=ctx();[523,659,784,1047,1319].forEach((f,i)=>{setTimeout(()=>{const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(f,c.currentTime);g.gain.setValueAtTime(0.12,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.4);o.connect(g).connect(getSfxGain());o.start();o.stop(c.currentTime+0.4)},i*50)});mkNoiseHP(0.3,0.06,3000)}catch(e){}},
  doubleTeamSE(){try{getSfxGain().gain.value=0.45;mkNoise(0.2,0.28);osc('sine',80,30,0.4,0.2);mkNoiseLP(0.25,0.15,400);setTimeout(()=>{mkNoise(0.15,0.2);osc('sine',100,40,0.25,0.15)},180)}catch(e){}},
  touchSE(){try{getSfxGain().gain.value=0.35;osc('sine',600,1000,0.08,0.05);osc('triangle',400,null,0.1,0.04)}catch(e){}},
  betrayalSE(){try{getSfxGain().gain.value=0.35;osc('sawtooth',200,50,0.5,0.08);mkNoiseLP(0.4,0.06,300)}catch(e){}},
  friendlyFireSE(){try{getSfxGain().gain.value=0.35;osc('triangle',500,200,0.15,0.08);mkNoise(0.1,0.1)}catch(e){}},
  // カウント SE (battle-engine.html と同設計: 低音 thud)
  count(){try{getSfxGain().gain.value=SE_MIX.count;osc('sine',100,40,0.12,0.15);mkNoiseLP(0.05,0.1,400);osc('triangle',50,null,0.08,0.06)}catch(e){}},
  // ロープエスケープ SE
  guEscapeSE(){try{getSfxGain().gain.value=SE_MIX.guEscapeSE;osc('triangle',300,150,0.2,0.1);mkNoise(0.15,0.08)}catch(e){}},
};
function hitSE(cat,dmg,volMul){
  const dr=clamp(dmg/20,0.3,1.5);
  const fn={strike:sfx.hitStrike,throw:sfx.hitThrow,submission:sfx.hitSub,
    aerial:sfx.hitAerial,ground:sfx.hitGround,rollup:sfx.hitRollup}[cat];
  if(fn)fn(dr,volMul);else sfx.hitStrike(dr,volMul);
}
// Guess category from move name (rough heuristic for replay)
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
