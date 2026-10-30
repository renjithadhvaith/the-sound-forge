/* The Sound Forge · forge-zoom.js — "Zoom" for the chart's mouth diagram.
   Zoom turns the diagram into a full-screen, scrollable view (the animation keeps running).
   Levels 1× 1.5× 2× 3× with − / + buttons, double-tap to step, Esc or Close to leave. */
(()=>{'use strict';
const box=document.getElementById('profileBox');if(!box)return;
const LV=[1,1.5,2,3];let i=0;
const wrap=document.createElement('div');wrap.className='pbWrap';box.parentNode.insertBefore(wrap,box);wrap.appendChild(box);
const mk=(tag,cls,html,label)=>{const e=document.createElement(tag);if(cls)e.className=cls;e.innerHTML=html;if(label)e.setAttribute('aria-label',label);if(tag==='button')e.type='button';return e};
const mag='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21M10.5 7.5v6M7.5 10.5h6"/></svg>';
const btn=mk('button','zoomBtn',mag+'<span>Zoom</span>',"Zoom in on the mouth diagram");
const minus=mk('button','','−',"Zoom out"),out=mk('output','','1×'),plus=mk('button','','+',"Zoom in"),done=mk('button','zx','Close',"Close zoom");
const bar=mk('div','zbar','');bar.append(minus,out,plus,done);
wrap.appendChild(btn);document.body.appendChild(bar);
const set=n=>{i=Math.max(0,Math.min(LV.length-1,n));box.style.setProperty('--z',LV[i]);out.textContent=LV[i]+'×';minus.disabled=i===0;plus.disabled=i===LV.length-1};
const open=()=>{document.body.classList.add('pbzoom');set(1);box.scrollTop=0;box.scrollLeft=0};
const close=()=>{document.body.classList.remove('pbzoom');box.style.removeProperty('--z');btn.focus()};
const on=()=>document.body.classList.contains('pbzoom');
btn.addEventListener('click',open);done.addEventListener('click',close);
minus.addEventListener('click',()=>set(i-1));plus.addEventListener('click',()=>set(i+1));
addEventListener('keydown',e=>{if(!on())return;if(e.key==='Escape')close();if(e.key==='+'||e.key==='=')set(i+1);if(e.key==='-')set(i-1)});
box.addEventListener('dblclick',e=>{if(!e.target.closest('svg'))return;on()?set((i+1)%LV.length):open()});
const sync=()=>{btn.hidden=!box.firstChild;if(!box.firstChild&&on())close()};
new MutationObserver(sync).observe(box,{childList:true});sync();
})();
