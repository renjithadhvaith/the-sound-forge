/* The Sound Forge · games.js — Aspiration Cannon + Frequency Ninja.
   Needs forge-core.js (Forge.mic / Forge.say) and breeze.js. All art is inline SVG/CSS: no emoji, so no tofu boxes. */
(()=>{'use strict';
const $=s=>document.querySelector(s);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const SHURIKEN='<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 2 29 19 46 24 29 29 24 46 19 29 2 24 19 19Z" fill="currentColor" stroke="var(--f-ink)" stroke-width="1.5" stroke-linejoin="round"/><circle cx="24" cy="24" r="5" fill="var(--f-bg)"/></svg>';
const HAMMER='<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="21" y="14" width="6" height="32" rx="2" fill="#a0693a" stroke="var(--f-ink)" stroke-width="1.5"/><rect x="6" y="4" width="36" height="16" rx="4" fill="var(--f-b)" stroke="var(--f-ink)" stroke-width="1.5"/></svg>';
const BALLOON='<svg viewBox="0 0 92 116" aria-hidden="true"><ellipse cx="46" cy="44" rx="40" ry="42" fill="var(--f-a)" stroke="var(--f-ink)" stroke-width="2"/><ellipse cx="32" cy="28" rx="9" ry="14" fill="#fff" opacity=".35"/><path d="M42 86h8l-4 8Z" fill="var(--f-a)"/><path d="M46 94q-8 10 0 20" fill="none" stroke="var(--f-ink)" stroke-width="2"/></svg>';

/* position of an element's centre relative to a stage */
const rel=(el,stage)=>{const a=el.getBoundingClientRect(),s=stage.getBoundingClientRect();return[a.left+a.width/2-s.left,a.top+a.height/2-s.top]};
/* average a reading for 600 ms (room-noise calibration) */
async function calib(read){let a=0,n=0;const t=performance.now();while(performance.now()-t<600){a+=read();n++;await sleep(30)}return a/Math.max(1,n)}
function chips(el,list,get,on){
  el.innerHTML=list.map(k=>`<button class="chip" data-k="${k}" aria-pressed="false">/${get(k).lab}/<small>${get(k).w}</small></button>`).join('');
  el.addEventListener('click',e=>{const b=e.target.closest('.chip');if(!b)return;
    el.querySelectorAll('.chip').forEach(c=>c.setAttribute('aria-pressed',String(c===b)));on(b.dataset.k);Forge.say(get(b.dataset.k).w)});
  return k=>el.querySelectorAll('.chip').forEach(c=>c.setAttribute('aria-pressed',String(c.dataset.k===k)));
}

/* =====================================================================
   GAME A · THE ASPIRATION CANNON  (microphone burst / transient detection)
   /p t k/ release a sudden puff of air → a sharp jump in loudness within ~1 frame.
   /b d g/ are voiced and start gently → no jump → the cannon fizzles.
   ===================================================================== */
const Cannon=(()=>{
  const TG={p:{lab:'p',w:'pie',place:'bilabial'},t:{lab:'t',w:'tie',place:'alveolar'},k:{lab:'k',w:'key',place:'velar'}};
  const stage=$('#cStage'),bz=Breeze.mount($('#cBreeze')),msg=t=>$('#cMsg').textContent=t;
  let key='p',mic=null,td=null,raf=0,floor=.004,prev=0,armed=true,sounding=0,lastFire=0,score=0,balloon=null;
  const mark=chips($('#cTargets'),Object.keys(TG),k=>TG[k],k=>{key=k;spawn()});mark('p');

  function spawn(){
    if(balloon)balloon.remove();
    balloon=document.createElement('div');balloon.className='balloon';
    balloon.style.left=(52+Math.random()*30)+'%';balloon.style.top=(12+Math.random()*26)+'%';
    balloon.innerHTML=BALLOON+`<b>${TG[key].w}</b>`;stage.appendChild(balloon);
  }
  function fire(){
    const b=balloon;if(!b||b.dataset.busy)return;b.dataset.busy='1';lastFire=performance.now();
    const barrel=$('#cBarrel');barrel.classList.remove('kick');void barrel.getBoundingClientRect();barrel.classList.add('kick');
    bz.play({manner:'stop',place:TG[key].place});
    const[sx,sy]=rel($('#cMuzzle'),stage),[ex,ey]=rel(b,stage);
    const ball=document.createElement('span');ball.className='ball';stage.appendChild(ball);
    const at=(x,y)=>`translate(${x-11}px,${y-11}px)`;
    ball.animate([{transform:at(sx,sy)},{transform:at((sx+ex)/2,Math.min(sy,ey)-50)},{transform:at(ex,ey)}],
      {duration:reduce?120:520,easing:'ease-out'}).finished.then(()=>{ball.remove();pop(b,ex,ey)});
  }
  function pop(b,x,y){
    for(let i=0;i<14;i++){
      const s=document.createElement('span');s.className='shard';stage.appendChild(s);
      const a=Math.random()*6.28,d=50+Math.random()*70;
      s.animate([{transform:`translate(${x}px,${y}px) scale(1)`,opacity:1},{transform:`translate(${x+Math.cos(a)*d}px,${y+Math.sin(a)*d}px) scale(.2)`,opacity:0}],{duration:650,easing:'ease-out'}).finished.then(()=>s.remove());
    }
    b.remove();balloon=null;$('#cScore').textContent=++score;
    msg(`POP! That /${TG[key].lab}/ carried a real puff of air.`);
    setTimeout(spawn,900);
  }
  function fizzle(){
    const barrel=$('#cBarrel');barrel.classList.remove('fizz');void barrel.getBoundingClientRect();barrel.classList.add('fizz');
    const[sx,sy]=rel($('#cMuzzle'),stage),s=document.createElement('span');s.className='smoke';stage.appendChild(s);
    s.animate([{transform:`translate(${sx-13}px,${sy-13}px) scale(.6)`,opacity:.7},{transform:`translate(${sx+10}px,${sy-50}px) scale(1.6)`,opacity:0}],{duration:800}).finished.then(()=>s.remove());
    bz.play({manner:'flow',place:TG[key].place});
    msg('No puff of air. That was soft, like /b/. Hold a tissue near your lips: it should flutter on /p/.');
  }
  const read=()=>{mic.an.getFloatTimeDomainData(td);let s=0;for(let i=0;i<td.length;i++)s+=td[i]*td[i];return Math.sqrt(s/td.length)};
  function loop(now){
    raf=requestAnimationFrame(loop);
    const r=read(),sens=+$('#cSens').value;
    if(Forge.deaf()){sounding=0;prev=r;armed=false;return}   // don’t hear the game’s own voice
    const k=14-10*sens;                                    // how far above the room noise a burst must be (14× … 4×)
    const jump=r>prev*1.8+floor;                           // a sudden rise within one frame = a transient
    if(armed&&r>floor*k&&jump&&now-lastFire>300){armed=false;sounding=0;fire()}
    if(r>floor*4){if(!sounding)sounding=now}
    else{if(sounding&&armed&&now-sounding>80)fizzle();sounding=0;armed=true}   // a sound with no burst = fizzle
    prev=r;
  }
  async function start(){
    const btn=$('#cStart');
    if(mic){stop();msg('Microphone off.');return}
    try{
      msg('Allow the microphone…');mic=await Forge.mic(1024);td=new Float32Array(mic.an.fftSize);
      msg('Stay quiet for a moment…');floor=Math.max(.003,(await calib(read))*1.5);
      btn.textContent='Stop microphone';msg(`Ready! Say “${TG[key].w}, ${TG[key].w}, ${TG[key].w}”.`);
      prev=0;armed=true;sounding=0;raf=requestAnimationFrame(loop);
    }catch(e){mic=null;msg('The microphone is blocked. Allow it in the browser, or use “Tap to fire” to practise.')}
  }
  function stop(){cancelAnimationFrame(raf);if(mic)mic.stop();mic=null;$('#cStart').textContent='Start microphone'}
  $('#cStart').addEventListener('click',start);
  $('#cFire').addEventListener('click',()=>{Forge.ctx();fire()});
  spawn();
  return{stop};
})();

/* =====================================================================
   GAME B · THE FREQUENCY NINJA  (AnalyserNode.getByteFrequencyData)
   hiss (/s ʃ/): energy above ~4000 Hz dominates              → shuriken
   buzz (/z ʒ/): energy below ~1000 Hz + a clear pitch peak    → hammer
   ===================================================================== */
const Ninja=(()=>{
  // cut = where "high" starts. /ʃ/ is lower in pitch than /s/, so it gets a lower cut.
  const TG={s:{lab:'s',w:'sun',voiced:false,cut:4000,place:'alveolar'},z:{lab:'z',w:'zoo',voiced:true,cut:4000,place:'alveolar'},
            sh:{lab:'ʃ',w:'ship',voiced:false,cut:2500,place:'postalveolar'},zh:{lab:'ʒ',w:'vision',voiced:true,cut:2500,place:'postalveolar'}};
  const stage=$('#nStage'),bz=Breeze.mount($('#nBreeze')),msg=t=>$('#nMsg').textContent=t;
  let key='s',mic=null,fd=null,noise=null,raf=0,score=0,busy=false,armed=false,cls='',since=0,quietSince=0;
  const mark=chips($('#nTargets'),Object.keys(TG),k=>TG[k],k=>{key=k;msg(TG[k].voiced?'Buzz it! Hand on your throat, then throw the hammer.':'Hiss it! No buzz in the throat, then throw the shuriken.')});mark('s');

  /* Energy per band AFTER subtracting the room's own noise (measured at start), so fans and hum don't count. */
  function analyse(){
    mic.an.getByteFrequencyData(fd);
    const bin=mic.ctx.sampleRate/mic.an.fftSize,cut=TG[key].cut,k0=Math.ceil(80/bin),k1=Math.min(fd.length,Math.floor(10000/bin));
    let lo=0,nl=0,hi=0,nh=0,pk=0;
    for(let k=k0;k<k1;k++){
      const f=k*bin,s=Math.max(0,fd[k]-noise[k]-4);
      if(f<1000){lo+=s;nl++;if(f<=400&&s>pk)pk=s}else if(f>=cut){hi+=s;nh++}
    }
    const loM=lo/Math.max(1,nl),hiM=hi/Math.max(1,nh);
    return{loM,hiM,pitched:pk>28&&pk>loM*1.8};            // pitched = a clear fundamental (80–400 Hz)
  }
  function classify(a,sc){
    if(a.pitched&&a.loM>10*sc&&a.hiM>5*sc)return'hammer';  // buzz: a clear pitch, with some hiss on top
    if(!a.pitched&&a.hiM>12*sc)return'shuriken';           // hiss: strong high-frequency energy, no pitch
    return'';
  }
  function throwWeapon(kind){
    if(busy)return;busy=true;bz.play({manner:'fricative',place:TG[key].place});
    const[sx,sy]=rel($('#nHand'),stage),oni=$('#oni'),[ex,ey]=rel(oni,stage);
    const el=document.createElement('span');el.className='proj';el.innerHTML=kind==='hammer'?HAMMER:SHURIKEN;stage.appendChild(el);
    const at=(x,y,r)=>`translate(${x-22}px,${y-22}px) rotate(${r}deg)`,spin=kind==='hammer'?540:1080;
    const t=TG[key],ok=t.voiced?kind==='hammer':kind==='shuriken';
    el.animate([{transform:at(sx,sy,0)},{transform:at(ex,ey,spin)}],{duration:reduce?120:480,easing:'cubic-bezier(.3,.7,.5,1)',fill:'forwards'}).finished.then(()=>{
      if(ok){
        el.remove();oni.classList.remove('hit');void oni.getBoundingClientRect();oni.classList.add('hit');
        $('#nScore').textContent=++score;msg(`Direct hit! /${t.lab}/ is ${t.voiced?'a buzz, so the hammer':'a hiss, so the shuriken'} wins.`);
        const keys=Object.keys(TG);key=keys[Math.random()*keys.length|0];mark(key);Forge.say(TG[key].w);
      }else{
        el.animate([{transform:at(ex,ey,spin)},{transform:at(ex-90,ey-70,spin*2),opacity:0}],{duration:420,fill:'forwards'}).finished.then(()=>el.remove());
        msg(`Clang! That was a ${kind==='hammer'?'buzz':'hiss'}. /${t.lab}/ needs a ${t.voiced?'buzz (hammer)':'hiss (shuriken)'}.`);
      }
      setTimeout(()=>{busy=false},450);
    });
  }
  function loop(now){
    raf=requestAnimationFrame(loop);
    const a=analyse(),sc=1.5-(+$('#nSens').value);          // sensitivity slider: 0.5× … 1.5× thresholds
    $('#nHiss').style.setProperty('--v',clamp(a.hiM/60*100,0,100)+'%');$('#nBuzz').style.setProperty('--v',clamp(a.loM/60*100,0,100)+'%');
    if(Forge.deaf()||busy){cls='';since=0;armed=false;quietSince=0;return}   // ignore the game's own voice and flying weapons
    const c=classify(a,sc);
    if(!c){
      cls='';since=0;
      if(a.hiM<6*sc&&a.loM<6*sc){if(!quietSince)quietSince=now;if(now-quietSince>300)armed=true}else quietSince=0;   // re-arm only after real quiet
      return;
    }
    quietSince=0;
    if(c!==cls){cls=c;since=now}
    if(armed&&now-since>=140){armed=false;throwWeapon(c)}   // steady for ~140 ms → exactly one throw per sound
  }
  async function start(){
    const btn=$('#nStart');if(mic){stop();msg('Microphone off.');return}
    try{
      msg('Allow the microphone…');mic=await Forge.mic(2048);mic.an.smoothingTimeConstant=.5;mic.an.minDecibels=-100;mic.an.maxDecibels=-30;
      fd=new Uint8Array(mic.an.frequencyBinCount);noise=new Float32Array(fd.length);
      msg('Stay quiet for a moment…');
      let n=0;const t0=performance.now();
      while(performance.now()-t0<800){mic.an.getByteFrequencyData(fd);for(let k=0;k<fd.length;k++)noise[k]+=fd[k];n++;await sleep(30)}
      for(let k=0;k<noise.length;k++)noise[k]/=Math.max(1,n);
      armed=false;busy=false;cls='';quietSince=0;
      btn.textContent='Stop microphone';msg(`Ready! Make the sound /${TG[key].lab}/ as in “${TG[key].w}”.`);raf=requestAnimationFrame(loop);
    }catch(e){mic=null;msg('The microphone is blocked. Allow it in the browser, or use the practice buttons.')}
  }
  function stop(){cancelAnimationFrame(raf);if(mic)mic.stop();mic=null;$('#nStart').textContent='Start microphone'}
  $('#nStart').addEventListener('click',start);
  $('#nShur').addEventListener('click',()=>{Forge.ctx();throwWeapon('shuriken')});
  $('#nHam').addEventListener('click',()=>{Forge.ctx();throwWeapon('hammer')});
  return{stop};
})();

/* ---------- tabs ---------- */
document.querySelectorAll('.tabs [data-g]').forEach(b=>b.addEventListener('click',()=>{
  const g=b.dataset.g;Cannon.stop();Ninja.stop();
  document.querySelectorAll('.tabs [data-g]').forEach(t=>t.setAttribute('aria-selected',String(t===b)));
  $('#cannonPanel').hidden=g!=='cannon';$('#ninjaPanel').hidden=g!=='ninja';
}));
document.addEventListener('visibilitychange',()=>{if(document.hidden){Cannon.stop();Ninja.stop()}});
})();
