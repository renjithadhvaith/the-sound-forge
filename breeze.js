/* The Sound Forge · breeze.js — the yellow-dot airflow, as a reusable canvas engine.
   const bz = Breeze.mount(canvasEl);  bz.play({manner:'stop', place:'bilabial'});
   stop      → dots queue up behind the closure, bunch, then explode out
   fricative → dots squeeze through a narrow gap and turn into wavy lines
   nasal     → the mouth is closed; dots turn UP into the nose and leave there
   others    → a gentle open flow (affricate = stop, then fricative) */
(()=>{'use strict';
const W=640,H=300,CY=.62,TOP=.5,BOT=.74,X0=.9,V=.5;
const PX={bilabial:.1,labiodental:.15,dental:.2,alveolar:.28,postalveolar:.36,palatal:.45,velar:.56,glottal:.7};
const NOSE=[[.6,TOP],[.6,.3],[.07,.3]];
const NROUTE=[[X0,CY],[.6,CY],[.6,.3],[.07,.3]];
const lerp=(a,b,t)=>a+(b-a)*t,clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const dist=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1]);
const plen=P=>P.slice(1).reduce((s,p,i)=>s+dist(P[i],p),0);
function along(P,d){
  for(let i=0;i<P.length-1;i++){const L=dist(P[i],P[i+1]);
    if(d<=L||i===P.length-2){const t=Math.min(d/L,1);return[lerp(P[i][0],P[i+1][0],t),lerp(P[i][1],P[i+1][1],t)]}
    d-=L}
}

function mount(cv){
  const dpr=Math.min(2,window.devicePixelRatio||1),g=cv.getContext('2d');
  cv.width=W*dpr;cv.height=H*dpr;cv.setAttribute('role','img');
  cv.setAttribute('aria-label','Side view of the mouth with yellow dots showing the airflow');
  const N=matchMedia('(prefers-reduced-motion: reduce)').matches?10:24;
  let job=null,raf=0,col={};

  const readCol=()=>{const s=getComputedStyle(cv),v=n=>s.getPropertyValue(n).trim();
    col={dot:v('--f-breeze')||'#ffd23f',line:v('--f-line')||'#4a3c28',fill:v('--f-surface2')||'#221810',
      tongue:v('--f-b')||'#93b26a',glow:document.documentElement.dataset.theme==='day'?0:14}};

  function dot(x,y,a,r=5){
    g.globalAlpha=clamp(a,0,1);g.fillStyle=g.shadowColor=col.dot;g.shadowBlur=col.glow;
    g.beginPath();g.arc(x*W,y*H,r,0,7);g.fill();g.shadowBlur=0;g.globalAlpha=1}
  function wave(pts,a){
    g.globalAlpha=clamp(a,0,1);g.strokeStyle=g.shadowColor=col.dot;g.shadowBlur=col.glow;g.lineWidth=3.4;g.lineCap='round';g.lineJoin='round';
    g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x*W,y*H):g.moveTo(x*W,y*H));g.stroke();g.shadowBlur=0;g.globalAlpha=1}

  function scene(close,px){
    g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,W,H);
    g.lineCap='round';g.lineJoin='round';
    const tube=(w,c)=>{g.strokeStyle=c;g.lineWidth=w;g.beginPath();NOSE.forEach(([x,y],i)=>i?g.lineTo(x*W,y*H):g.moveTo(x*W,y*H));g.stroke()};
    tube(30,col.line);                                           // nasal passage (outline)
    g.fillStyle=col.fill;g.strokeStyle=col.line;g.lineWidth=2;   // mouth cavity
    g.beginPath();g.roundRect(.03*W,TOP*H,(X0+.02-.03)*W,(BOT-TOP)*H,22);g.fill();g.stroke();
    tube(26,col.fill);                                           // open the nasal doorway
    if(close>.01){g.fillStyle=col.tongue;g.globalAlpha=.6;       // tongue / lips closing the tube
      g.beginPath();g.ellipse(px*W,BOT*H,28,close*(BOT-TOP)*H,0,Math.PI,2*Math.PI);g.fill();g.globalAlpha=1}
  }
  const idle=()=>{readCol();scene(0,.28)};

  function build(mode,px){
    const seed=Array.from({length:N},()=>[Math.random(),Math.random()]),j={mode,px,seed,t0:0};
    if(mode==='stop'){
      j.xs=seed.map((_,i)=>px+.02+i*.0105);                      // queue positions behind the closure
      j.ta=j.xs.map((x,i)=>i*.05+(X0-x)/V);                      // arrival times
      j.Tb=Math.max(...j.ta)+.3;j.dur=j.Tb+1;
    }else if(mode==='nasal'){j.len=plen(NROUTE);j.dur=(N-1)*.05+j.len/V+.25}
    else j.dur=(N-1)*.05+(X0-.03)/V+.35;
    return j}

  function fpos(j,i,t){           // fricative / flow position of dot i at time t
    const xn=X0-V*(t-i*.05),past=Math.max(0,j.px-xn),x=xn-past*1.1,o=((i%5)-2)*.02;
    const y=j.mode==='fric'
      ? CY+o*(.15+.85*clamp(Math.abs(xn-j.px)/.14,0,1))+.03*Math.sin(past*34+i*.7)*clamp(past/.05,0,1)
      : CY+o+.012*Math.sin(xn*18+i);
    return[x,y,past]}

  function frame(now){
    const j=job;if(!j)return;
    const T=(now-j.t0)/1000,px=j.px;
    if(T>j.dur){if(j.next){job=j.next;job.t0=now;raf=requestAnimationFrame(frame)}else{job=null;idle()}return}
    if(j.mode==='stop'){
      if(T<j.Tb){
        scene(clamp(T/.3,0,1),px);
        for(let i=0;i<N;i++){const t=T-i*.05;if(t<0)continue;
          const d=X0-j.xs[i],arrived=V*t>=d,jit=arrived?Math.sin(T*55+i*2)*.014*clamp((T-j.ta[i])/.25,0,1):0;
          dot(X0-Math.min(V*t,d),CY+jit,1)}                      // bunch up
      }else{
        const u=T-j.Tb;scene(Math.max(0,1-u*6),px);
        g.strokeStyle=col.dot;g.lineWidth=4;g.globalAlpha=clamp(.7-u*1.4,0,1);
        g.beginPath();g.arc(px*W,CY*H,u*220,0,7);g.stroke();g.globalAlpha=1;
        for(let i=0;i<N;i++){const[a,b]=j.seed[i],ang=Math.PI+(a-.5)*2.4,sp=.4+b*.7;
          const x=j.xs[i]+Math.cos(ang)*sp*u;let y=CY+Math.sin(ang)*sp*u*1.2;
          if(x>.04)y=clamp(y,TOP+.03,BOT-.03);if(x>-.02)dot(x,y,1-u/.9)}   // burst
      }
    }else if(j.mode==='nasal'){
      scene(clamp(T/.3,0,1),px);
      for(let i=0;i<N;i++){const d=V*(T-i*.05);if(d<0||d>j.len)continue;
        const[x,y]=along(NROUTE,d);dot(x,y,clamp((j.len-d)/.1,0,1))}      // up and out of the nose
    }else{
      scene(j.mode==='fric'?lerp(.2,.82,clamp(T/.3,0,1)):.25,px);
      for(let i=0;i<N;i++){if(T<i*.05)continue;
        const[x,y,past]=fpos(j,i,T),a=clamp((x-.03)/.05,0,1);if(a<=0)continue;
        if(j.mode==='fric'&&past>.02)wave([0,1,2,3,4,5].map(k=>fpos(j,i,T-k*.025)).filter(p=>p[0]<=X0),a*.9); // wavy line
        else dot(x,y,a)}
    }
    raf=requestAnimationFrame(frame);
  }

  function play(c){
    cancelAnimationFrame(raf);readCol();
    const px=PX[c.place]||.3,m=c.manner;
    let j;
    if(m==='stop')j=build('stop',px);
    else if(m==='affricate'){j=build('stop',px);j.next=build('fric',px)}
    else if(m==='fricative')j=build('fric',px);
    else if(m==='nasal')j=build('nasal',px);
    else j=build('flow',px);
    job=j;j.t0=performance.now();raf=requestAnimationFrame(frame);
  }
  window.addEventListener('forge:theme',()=>{readCol();if(!job)idle()});
  idle();
  return{play,clear:()=>{cancelAnimationFrame(raf);job=null;idle()}};
}
window.Breeze={mount,PLACE:PX};
})();
