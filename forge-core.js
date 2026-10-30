/* The Sound Forge · forge-core.js
   Skins (data-theme + localStorage), "Tap to Awaken" overlay, shared AudioContext + mic helper.
   Load in <head> (no defer) so the saved skin is applied before first paint. */
(()=>{'use strict';
const root=document.documentElement,KEY='forge-theme';
const THEMES={
  day:{n:'Day Mode',jp:'昼',sw:'linear-gradient(135deg,#fffaf0,#eadfc3)'},
  night:{n:'Night Mode',jp:'夜',sw:'linear-gradient(135deg,#14235a,#050816)'},
  yokai:{n:'Yokai',jp:'妖怪',sw:'linear-gradient(135deg,#ff5a3c,#2b1741)'},
  mecha:{n:'Mecha',jp:'メカ',sw:'linear-gradient(135deg,#2de2e6,#0a2530)'},
  ninja:{n:'Ninja',jp:'忍者',sw:'linear-gradient(135deg,#e03a2c,#17171d)'}};
const store={
  get(k,s){try{return(s?sessionStorage:localStorage).getItem(k)}catch(e){return null}},
  set(k,v,s){try{(s?sessionStorage:localStorage).setItem(k,v)}catch(e){}}};

const Forge=window.Forge={
  themes:THEMES, ready:false,
  get theme(){return root.dataset.theme},
  setTheme(t,save=true){
    if(!THEMES[t])t='day';
    root.dataset.theme=t;
    if(save)store.set(KEY,t);
    document.querySelectorAll('.forge-tray [data-t]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.t===t)));
    window.dispatchEvent(new CustomEvent('forge:theme',{detail:t}));
  },
  /* One shared AudioContext for the whole site */
  ctx(){
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!Forge._c&&AC)Forge._c=new AC();
    if(Forge._c&&Forge._c.state==='suspended')Forge._c.resume();
    return Forge._c||null;
  },
  say(text){
    try{const s=window.speechSynthesis;if(!s)return;s.cancel();
      const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=.85;
      Forge.deafUntil=performance.now()+1200+text.length*120;          // estimate, until we hear "end"
      u.onend=u.onerror=()=>{Forge.deafUntil=performance.now()+500};   // plus a little room echo
      s.speak(u)}catch(e){}
  },
  deafUntil:0,
  /* true while the game itself is talking: the mic games ignore the microphone then */
  deaf(){return performance.now()<Forge.deafUntil||!!(window.speechSynthesis&&speechSynthesis.speaking)},
  /* Microphone → AnalyserNode. Never routed to the speakers (feedback!). Call from a tap. */
  async mic(fft=2048){
    const c=Forge.ctx();
    if(!c||!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)throw new Error('nomic');
    const s=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
    const an=c.createAnalyser();an.fftSize=fft;an.smoothingTimeConstant=.3;
    c.createMediaStreamSource(s).connect(an);
    return{an,ctx:c,stop(){s.getTracks().forEach(t=>t.stop())}};
  }
};

/* Apply the saved skin immediately (first visit follows the device's light/dark setting) */
const saved=store.get(KEY);
Forge.setTheme(THEMES[saved]?saved:(matchMedia('(prefers-color-scheme: dark)').matches?'night':'day'),false);

/* ---------- Awaken: unlock audio on the first tap ---------- */
function unlock(){
  const c=Forge.ctx();
  try{ // silent blip: fully unlocks iOS/Safari audio output
    if(c){const o=c.createOscillator(),g=c.createGain();g.gain.value=.0001;o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.05)}
    if(typeof window.ac==='function')window.ac(); // the chart page's own audio helper, if present
    if(window.speechSynthesis){const u=new SpeechSynthesisUtterance(' ');u.volume=0;speechSynthesis.speak(u)}
  }catch(e){}
  Forge.ready=true;store.set('forge-awake','1',true);
  window.dispatchEvent(new Event('forge:awake'));
}
function boot(){
  /* skin toggle */
  const box=document.createElement('div');box.className='forge-skin';
  box.innerHTML='<button type="button" aria-label="Change skin" aria-expanded="false"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18c1.7 0 2-1.2 1.4-2.2-.7-1.2.1-2.8 1.6-2.8H17a4 4 0 0 0 4-4c0-5-4-9-9-9Z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10.5" cy="7" r="1.2"/><circle cx="15.5" cy="7.5" r="1.2"/></svg></button>'+
    '<div class="forge-tray" role="group" aria-label="Skins">'+
    Object.entries(THEMES).map(([k,v])=>`<button type="button" data-t="${k}" aria-pressed="${k===Forge.theme}"><span class="forge-sw" style="background:${v.sw}"></span>${v.n}<small>${v.jp}</small></button>`).join('')+'</div>';
  document.body.appendChild(box);
  const btn=box.firstElementChild;
  btn.addEventListener('click',()=>{const o=box.classList.toggle('open');btn.setAttribute('aria-expanded',String(o))});
  box.querySelector('.forge-tray').addEventListener('click',e=>{const b=e.target.closest('[data-t]');if(b)Forge.setTheme(b.dataset.t)});
  document.addEventListener('pointerdown',e=>{if(!box.contains(e.target)){box.classList.remove('open');btn.setAttribute('aria-expanded','false')}});

  /* Awaken overlay: shown once per visit; later pages unlock silently on the first tap */
  if(store.get('forge-awake',true)){
    addEventListener('pointerdown',unlock,{once:true,capture:true});return;
  }
  const ov=document.createElement('button');ov.id='awaken';ov.type='button';
  ov.innerHTML='<span class="orb" aria-hidden="true"></span><strong>Tap to Awaken the Forge</strong><span lang="ja">タップして鍛冶場を起こそう</span>';
  document.body.appendChild(ov);
  ov.addEventListener('click',()=>{unlock();ov.classList.add('go');setTimeout(()=>ov.remove(),700)},{once:true});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot):boot();
})();
