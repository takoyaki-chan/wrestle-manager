const fs=require('fs'),os=require('os'),path=require('path');
const data=JSON.parse(fs.readFileSync(path.join(os.tmpdir(),'wm-mvp-cal','cal-100-42.json'),'utf-8')).sort((a,b)=>a.season-b.season);
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const belt=r=>(r.cap+r.def>0||r.hold||r.tHold||r.tDef>0||r.tWin>0);
// 難度係数: 互角=1.0、格下相手ほど小、格上相手ほど大。strength s で振れ幅を変える
const diff=(e,s,lo,hi)=>e.oppOv==null?1:clamp(1-s*(e.selfOv-e.oppOv),lo,hi);
const title=(r,s,lo,hi)=>r.tEv.reduce((a,e)=>a+((e.kind==='tDef'||e.kind==='uDef'||e.kind==='uCap')?13*(diff(e,s,lo,hi)-1):0),0);
const upset=(r,p1,p2,g)=>r.upsets.reduce((a,u)=>a+(u[0]>=g?(u[1]>=2?p2:p1):0),0);
const pop=(r,k,cap)=>clamp(Math.max(0,r.popGain||0)*k,0,cap);
const tour=(r,t)=>(r.tag==='champion'?t.tag:r.tag==='runnerUp'?t.tag/2:0)+(r.awWins||0)*t.awWin+(r.aw==='champion'?t.aw:r.aw==='runnerUp'?t.aw/2:0)+(r.jt==='champion'?t.jt:r.jt==='runnerUp'?t.jt/2:0);
const T2={tag:16,awWin:4,aw:10,jt:15},T3={tag:22,awWin:5,aw:13,jt:20};
const V={
 '現行':r=>0,
 '案1 強(0.05/0.3〜1.5)':r=>title(r,.05,.3,1.5),
 '案1 最強(0.07/0.15〜1.8)':r=>title(r,.07,.15,1.8),
 '撃破 6/15':r=>upset(r,6,15,5),
 '撃破 10/25':r=>upset(r,10,25,5),
 '伸び×1(上限20)':r=>pop(r,1,20),
 '大会T3':r=>tour(r,T3),
 'A: 案1強+撃破6/15+伸び0.5/12+T2':r=>title(r,.05,.3,1.5)+upset(r,6,15,5)+pop(r,.5,12)+tour(r,T2),
 'B: 案1強+撃破8/20+伸び0.5/12+T3':r=>title(r,.05,.3,1.5)+upset(r,8,20,5)+pop(r,.5,12)+tour(r,T3),
 'C: 案1最強+撃破10/25+伸び1/20+T3':r=>title(r,.07,.15,1.8)+upset(r,10,25,5)+pop(r,1,20)+tour(r,T3),
 'D: 案1最強+撃破6/15+伸び0.5/12+T2':r=>title(r,.07,.15,1.8)+upset(r,6,15,5)+pop(r,.5,12)+tour(r,T2),
};
console.log('案'.padEnd(34),'| ベルト無し | 統一絡み | 団体王者のみ | 前年同じ | 最長 | 人数 | 年齢 | MVPの王座戦の平均格差');
for(const [n,fn] of Object.entries(V)){let free=0,uni=0,org=0,rep=0,mx=1,cur=1,prev=null,age=0,gsum=0,gn=0;const u=new Set();
 for(const d of data){const top=d.rows.map(r=>({r,s:r.pts+r.ppvSynth+fn(r)})).sort((a,b)=>b.s-a.s)[0].r;
  if(!belt(top))free++;const isU=top.cap+top.def>0||top.hold;if(isU)uni++;else if(belt(top))org++;
  if(prev===top.id){rep++;cur++;mx=Math.max(mx,cur);}else cur=1;prev=top.id;u.add(top.id);age+=top.age||0;
  top.tEv.forEach(e=>{if(e.oppOv!=null&&e.kind!=='tWin'){gsum+=e.selfOv-e.oppOv;gn++;}});}
 console.log(n.padEnd(34),'|',String(free).padStart(6),'    |',String(uni).padStart(5),'   |',String(org).padStart(7),'     |',String(rep).padStart(5),'   |',String(mx).padStart(3),' |',String(u.size).padStart(3),' |',(age/100).toFixed(1),'|',(gsum/Math.max(1,gn)).toFixed(1));}
