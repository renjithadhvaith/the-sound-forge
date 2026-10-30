/* articulation.js · The Sound Forge
   Accurate articulation card: who touches whom, how long, where the air goes.
   Needs these globals from index.html: C, PLACE, MANNER, say, accentOf.  Exposes window.ART. */
(function(){
'use strict';
const NS='http://www.w3.org/2000/svg',CL={f:'#ef5350',n:'#ffb300',o:'#66bb6a'};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),lerp=(a,b,t)=>a+(b-a)*t,ease=t=>t*t*(3-2*t);
const REDUCE=matchMedia('(prefers-reduced-motion:reduce)').matches;

/* ===== 1. POSES: tongue tip,blade,front,back,root (x,y) · jaw · lower-lip dx,dy · round · spread · velum (0 shut → 1 open) ===== */
const R=[76,150,96,147,122,146,160,147,196,166];
const POSE={
 REST:[...R,0,0,0,0,0,0],P:[...R,-15,0,0,0,0,0],PR:[...R,-4,0,0,0,0,0],M:[...R,-15,0,0,0,0,1],F:[...R,-10,20,-5,0,0,0],H:[...R,4,0,0,0,0,0],
 T:[88,105,104,117,126,132,162,142,196,166,-2,0,0,0,0,0],TR:[82,128,102,134,126,142,162,146,196,166,0,0,0,0,0,0],N:[88,105,104,117,126,132,162,142,196,166,-2,0,0,0,0,1],
 K:[78,148,98,142,138,128,182,105,198,168,-2,0,0,0,0,0],KR:[78,150,98,147,126,146,166,142,196,166,0,0,0,0,0,0],NG:[78,148,98,142,138,128,182,105,198,168,-2,0,0,0,0,1],
 TH:[65,131,88,139,118,144,160,147,196,166,-3,0,0,0,0,0],S:[78,134,96,110,124,128,160,142,196,166,-8,0,0,0,.6,0],
 SH:[88,126,112,108,132,114,162,138,196,166,-6,0,0,.45,0,0],SHC:[88,126,112,105,132,114,162,138,196,166,-6,0,0,.45,0,0],
 R:[106,120,114,126,138,120,168,128,198,166,-4,0,0,.45,0,0],W:[86,150,108,144,134,140,178,118,198,166,-6,0,0,1,0,0],J:[84,140,112,126,146,109,172,132,198,166,-4,0,0,0,.7,0]};
const PIN={'upper lip':[41,127],'upper teeth':[66,129],'alveolar ridge':[90,104],'postalveolar':[112,105],'hard palate':[148,95],'soft palate':[184,103],'glottis':[231,150]};
const ROOF=[[44,128],[62,128],[68,113],[78,104],[90,103],[100,107],[108,106],[122,100],[146,92],[170,94],[183,101],[232,104]];
const interp=(t,x)=>{if(x<=t[0][0])return t[0][1];for(let i=1;i<t.length;i++)if(x<=t[i][0])return lerp(t[i-1][1],t[i][1],(x-t[i-1][0])/(t[i][0]-t[i-1][0]));return t[t.length-1][1]};

/* ===== 2. DATA: one object per consonant (verified dataset only) ===== */
const K=(ipa,example,act,pas,contact,gapMm,holdMs,release,voiced,votMs,airPath,lipShape,tongueShape,pose,tryIt,jpTip,hissMs)=>({ipa,example,activeArticulator:act,passiveTarget:pas,contact,gapMm,holdMs,release,voicing:{voiced,votMs},airPath,lipShape,tongueShape,pose,tryIt,jpTip,hissMs});
const cn='center-touch-sides-open',fT='full-touch',nT='near-touch';
const DATA={
 p:K('p','pen','lower lip','upper lip',fT,0,[60,100],'pop-burst',0,70,'mouth','closed, then pop','relaxed, low','P','Press your lips together. Hold one beat… now let go with a tiny puff!','Japanese ぱ is softer. In English add a puff: a tissue in front of your lips should flutter.'),
 b:K('b','bed','lower lip','upper lip',fT,0,[50,80],'pop-burst',1,null,'mouth','closed, then pop','relaxed, low','P','Lips together and hum from the start. Hold one beat… now pop!','Keep the buzz on right from the start, with no big puff.'),
 t:K('t','ten','tongue tip','alveolar ridge',fT,0,[60,100],'pop-burst',0,60,'mouth','neutral','tip raised to the ridge','T','Press your tongue tip on the bumpy ridge. Hold one beat… now let go with a tiny pop!','Japanese た touches the teeth. For English t, move back to the bumpy ridge and add a puff.'),
 d:K('d','dog','tongue tip','alveolar ridge',fT,0,[50,80],'pop-burst',1,null,'mouth','neutral','tip raised to the ridge','T','Tongue tip on the ridge, buzz on. Hold one beat… release!','Japanese だ touches the teeth. Move the tip back to the bumpy ridge.'),
 k:K('k','cat','tongue back','soft palate',fT,0,[60,100],'pop-burst',0,60,'mouth','neutral','back raised to the soft roof','K','Lift the back of your tongue up to the soft roof. Hold one beat… pop, with a puff!','English k has a stronger puff than Japanese か.'),
 g:K('g','go','tongue back','soft palate',fT,0,[50,80],'pop-burst',1,null,'mouth','neutral','back raised to the soft roof','K','Back of tongue up, buzz on. Hold one beat… pop!','Same place as か, with the buzz on.'),
 m:K('m','moon','lower lip','upper lip',fT,0,null,'smooth',1,null,'nose','closed','relaxed, low','M','Close your lips and hum. Keep going as long as you like. The air leaves through your nose!','Like ん before ま: lips closed, air through the nose.'),
 n:K('n','nose','tongue tip','alveolar ridge',fT,0,null,'smooth',1,null,'nose','neutral','tip raised to the ridge','N','Tongue tip on the ridge and hum. Pinch your nose… the hum stops!','Keep the tongue tip on the bumpy ridge the whole time.'),
 'ŋ':K('ŋ','sing','tongue back','soft palate',fT,0,null,'smooth',1,null,'nose','neutral','back raised to the soft roof','NG','Back of tongue up to the soft roof, then hum through your nose, like the end of “sing”.','Say it at the end of a word. Stop without adding a “g”.'),
 f:K('f','fish','lower lip','upper teeth',nT,1,null,'smooth',0,null,'mouth','lower lip tucked under top teeth','relaxed, low','F','Rest your top teeth lightly on your bottom lip. Blow: ffff… as long as you like.','ふ uses both lips. For English f, top teeth touch the bottom lip.'),
 v:K('v','van','lower lip','upper teeth',nT,1,null,'smooth',1,null,'mouth','lower lip tucked under top teeth','relaxed, low','F','Same teeth-on-lip, now buzz: vvvv. Your lip should tickle!','Not both lips like ぶ. Teeth on lip, buzz on.'),
 'θ':K('θ','think','tongue tip','upper teeth',nT,null,null,'smooth',0,null,'mouth','neutral','tip peeks between the teeth','TH','Poke your tongue tip out a little so it brushes your teeth. Blow softly: thhh… hold it!','Japanese has no θ. It is not さ! Show a little tongue.'),
 'ð':K('ð','this','tongue tip','upper teeth',nT,null,null,'smooth',1,null,'mouth','neutral','tip peeks between the teeth','TH','Same tongue-peek, now add the hum: thhh with a buzz.','Not ざ or だ. Tongue peeks out, buzz on.'),
 s:K('s','sun','tongue blade','alveolar ridge',nT,1,null,'smooth',0,null,'mouth','slightly spread','grooved channel aimed at the teeth','S','Teeth almost closed, tongue blade near the ridge. Leave a hair-wide gap and blow: sssss like a snake.','Like す. Before “ee”, keep it s: “see” is not し “shee”.'),
 z:K('z','zoo','tongue blade','alveolar ridge',nT,1,null,'smooth',1,null,'mouth','slightly spread','grooved channel aimed at the teeth','S','Same snake hiss, now buzz: zzzz like a bee. Hold it!','Keep it a smooth buzz, not a pop.'),
 'ʃ':K('ʃ','ship','tongue blade','postalveolar',nT,1,null,'smooth',0,null,'mouth','slightly rounded','blade raised behind the ridge','SH','Pull your tongue back a little and round your lips. Leave a hair-wide gap and blow: shhhhh, like hushing a baby.','Close to し, but round the lips a little more.'),
 'ʒ':K('ʒ','vision','tongue blade','postalveolar',nT,1,null,'smooth',1,null,'mouth','slightly rounded','blade raised behind the ridge','SH','The shhh shape with a hum on: the middle sound of “vision”. Hold it!','Like ジ without the first pop: smooth and buzzing.'),
 'tʃ':K('tʃ','chair','tongue blade','postalveolar',fT,0,[40,60],'pop-then-hiss',0,null,'mouth','slightly rounded','blade to just behind the ridge','SHC','Press your tongue blade just behind the ridge. Hold a blink… now slide into shhh: tsh!','Close to チ. Round your lips a little more and make the hiss clear.',80),
 'dʒ':K('dʒ','jump','tongue blade','postalveolar',fT,0,[40,60],'pop-then-hiss',1,null,'mouth','slightly rounded','blade to just behind the ridge','SHC','Same as ch, but hum from the very start: j-j-jump!','Close to ジ. Start with the tongue touching, buzz on, then release.',80),
 h:K('h','hat','vocal folds','glottis','open',null,null,'smooth',0,null,'mouth','neutral','low and relaxed','H','Open your mouth and breathe out like fogging a mirror: hhh. Nothing in your mouth touches.','Like は. Keep lips and tongue relaxed. It is only a breath.'),
 l:K('l','leg','tongue tip','alveolar ridge',cn,null,null,'smooth',1,null,'tongue-sides','neutral','tip on the ridge, sides open','T','Touch your tongue tip on the ridge and keep it there. Hum: the air flows around the sides.','Japanese ら is a quick tap. For English l, the tip stays on the ridge.'),
 'r':K('ɹ','red','tongue tip','postalveolar','open',null,null,'smooth',1,null,'mouth','slightly rounded','bunched, or tip curled back; touches nothing','R','Pull your tongue back (or curl the tip up) and touch nothing. Round your lips a little and hum: rrr.','Not ら! Nothing touches. Lips a bit round.'),
 w:K('w','wet','lips + tongue back','upper lip + soft palate','open',null,[80,120],'smooth',1,null,'mouth','rounded','back raised toward the soft roof','W','Round your lips into a tiny tunnel, then glide them open into the vowel: w-wet.','Round your lips more than for わ.'),
 j:K('j','yes','tongue front','hard palate','open',null,null,'smooth',1,null,'mouth','spread or neutral','front raised toward the hard roof','J','Tongue front near the hard roof but not touching. Glide straight into the vowel: yes.','Like や. Keep the tongue front close to the roof.')
};
/* kid glosses */
const PG={bilabial:'both lips',labiodental:'lip + top teeth',dental:'tongue on the teeth',alveolar:'the bumpy ridge behind your top teeth',postalveolar:'just behind the bumpy ridge',palatal:'the hard roof',velar:'the soft roof at the back',glottal:'the voice box'};
const MG={stop:'air is trapped, then pops',fricative:'air squeezes through a tiny gap',affricate:'a stop that melts into a hiss',nasal:'air goes out your nose',approximant:'a smooth glide'};
const AIRT={mouth:'out through the mouth','nose':'out through the nose (nose gate OPEN)','tongue-sides':'around the sides of the tongue'};
const LT={'full-touch':'FULL TOUCH','near-touch':'NEAR TOUCH',open:'NO TOUCH'};LT[cn]='CENTER TOUCH · sides open';
const CONF={s:['ʃ'],'ʃ':['s'],t:['θ'],'θ':['t','s'],b:['v'],v:['b','w'],w:['v'],'tʃ':['dʒ'],'dʒ':['tʃ'],l:['r'],r:['l']};

/* ===== 3. TIMELINE PLAN: phases [label, ms|null, pose, contact f/n/o, air mode, text] ===== */
function phases(d){
 const col=d.voicing.voiced?'BUZZ':'HISS',rng=a=>a[0]+'–'+a[1]+' ms';
 if(d.release==='pop-burst'){const r={P:'PR',T:'TR',K:'KR'}[d.pose],ph=[['HOLD',Math.round((d.holdMs[0]+d.holdMs[1])/2),d.pose,'f','bunch',rng(d.holdMs)],['BURST',0,r,'o','burst','pop!']];
  if(d.voicing.votMs)ph.push(['PUFF',d.voicing.votMs,r,'o','puff','~'+d.voicing.votMs+' ms']);return ph}
 if(d.release==='pop-then-hiss')return[['TOUCH',Math.round((d.holdMs[0]+d.holdMs[1])/2),d.pose,'f','bunch',rng(d.holdMs)],['HISS',d.hissMs,'SH','n','hiss','~'+d.hissMs+' ms']];
 if(d.airPath==='nose')return[['HOLD',null,d.pose,'f','nasal','holdable · air via nose']];
 if(d.airPath==='tongue-sides')return[['HOLD',null,d.pose,'f','side','holdable · sides open']];
 if(d.contact==='open')return[[d.holdMs||d.ipa==='j'?'GLIDE':'HOLD',d.holdMs?Math.round((d.holdMs[0]+d.holdMs[1])/2):null,d.pose,'o','flow',d.holdMs?rng(d.holdMs):d.ipa==='j'?'quick glide':'holdable']];
 return[[col,null,d.pose,'n','hiss','holdable']];
}
Object.values(DATA).forEach(d=>{d.phases=phases(d);d.phases.forEach(p=>{p.holdable=!(p[1]>0)&&(p[0]===col(d)||['HOLD','GLIDE'].includes(p[0])&&d.holdMs==null||false)});});
function col(d){return d.voicing.voiced?'BUZZ':'HISS'}
const stretchy=(d,i,p)=>p[1]==null;

/* ===== 4. SVG MOUTH ===== */
const el=(h)=>{const t=document.createElement('template');t.innerHTML=h.trim();return t.content.firstChild};
function mouthSVG(d,acc){
 const pins=d.passiveTarget.split(' + ').map(k=>PIN[k]);
 const pinG=pins.map((p,i)=>`<g class="pin" tabindex="0" role="img" aria-label="Contact point ${i+1}: ${d.activeArticulator} to ${d.passiveTarget}, ${LT[d.contact]}" data-i="${i}" transform="translate(${p[0]},${p[1]})"><circle class="pring" r="8"/><circle class="pdot" r="3.2"/><text class="tip" y="-13">${d.activeArticulator} → ${d.passiveTarget}</text></g>`).join('');
 const dots=Array.from({length:14},()=>'<circle class="adot" r="3.2"/>').join('');
 return `<svg viewBox="0 0 300 230" class="mouth" role="img" aria-label="Side view of the mouth showing how /${d.ipa}/ is made" style="--accent:${acc}">
 <path d="M40 60C40 30 95 22 160 26C232 30 285 60 285 120C285 168 258 196 214 206L206 224L150 216C92 210 34 180 34 120C34 96 36 78 40 60Z" fill="#20180e" stroke="#4a3c28" stroke-width="1.4"/>
 <path class="nasal" d="M231 152L228 128L222 106L214 88L190 72L140 62L90 62L52 68" fill="none" stroke="#3a2f1f" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity=".55"/>
 <circle cx="50" cy="68" r="3.5" fill="#12100a" stroke="#4a3c28"/>
 <path d="M227 104L231 152M231 152L226 190" fill="none" stroke="#4a3c28" stroke-width="1.4"/>
 <path id="mTongue" fill="#6f9048" fill-opacity=".75" stroke="#93b26a" stroke-width="1.6" stroke-linejoin="round"/>
 <path d="M68 113C72 106 82 100 90 103C96 106 100 109 108 106C122 100 146 91 170 94C176 95 180 97 183 101" fill="none" stroke="#a88a58" stroke-width="3.2" stroke-linecap="round"/>
 <path id="mVel" fill="none" stroke="#c4808f" stroke-width="6" stroke-linecap="round"/><circle id="mUvula" r="3.4" fill="#c4808f"/>
 <rect x="62" y="111" width="7" height="17" rx="2" fill="#efe6d2"/>
 <g id="mJaw"><rect x="62" y="146" width="7" height="15" rx="2" fill="#efe6d2"/><path d="M66 163Q70 192 108 197L206 194" fill="none" stroke="#4a3c28" stroke-width="1.4"/></g>
 <ellipse id="mUp" fill="#c88a72"/><ellipse id="mLo" fill="#c88a72"/>
 <g transform="translate(236,138)" id="mBuzz">${[0,6,12,18].map(x=>`<rect class="bz" x="${x}" width="3.4" height="20" rx="1.5"/>`).join('')}</g>
 <g class="lb"><text x="52" y="88">nose</text><text x="112" y="124" style="fill:#c9bea9">ridge</text><text x="124" y="80">hard palate</text><text x="190" y="82">soft palate</text><text x="20" y="176">lips</text><text x="150" y="176">tongue</text><text x="226" y="132">voice box</text></g>
 <g id="mGate"><rect x="196" y="40" width="74" height="15" rx="7" fill="#12100a" stroke="#4a3c28"/><text id="mGateT" x="233" y="51" text-anchor="middle"></text></g>
 ${dots}
 <g id="mGauge" transform="translate(0,0)"><rect id="mGbg" width="52" height="15" rx="6" fill="#12100a" fill-opacity=".85"/><path id="mGr" fill="none" stroke="#efe6d2" stroke-width="1.4"/><text id="mGt" x="14" y="11"></text></g>
 ${pinG}</svg>`;
}

/* ===== 5. ANIMATOR ===== */
let SLOW=10;const loops=new Map();
function show(c,profileBox,infoEl,accentOf){
 let raf=0;const pl=loops.get(profileBox);pl&&pl();loops.set(profileBox,()=>cancelAnimationFrame(raf));
 const d=DATA[c.ipa],acc=accentOf?accentOf(c):'#e7ac5f';
 const ph=d.phases;
 const tl=ph.map((p,i)=>`<div class="tseg k-${p[3]}${stretchy(d,i,p)?' hold':''}" data-i="${i}"><b>${p[0]}</b><small>${p[5]}</small></div>`).join('');
 profileBox.innerHTML=`${mouthSVG(d,acc)}
  <div class="tlwrap"><div class="tl" id="tl">${tl}<i class="playhead" id="playhead"></i></div>
  <p class="tlnote" id="tlnote"></p>
  <div class="ctl"><button class="btn" id="aReplay">▶ Replay</button><button class="btn" id="aSlow" aria-pressed="true">🐢 Slow-motion ×10</button></div></div>`;
 const g=(s)=>profileBox.querySelector(s),gp=[...profileBox.querySelectorAll('.pin')];
 const E={tongue:g('#mTongue'),vel:g('#mVel'),uv:g('#mUvula'),jaw:g('#mJaw'),up:g('#mUp'),lo:g('#mLo'),buzz:g('#mBuzz'),gate:g('#mGateT'),dots:[...profileBox.querySelectorAll('.adot')],
  gauge:g('#mGauge'),gr:g('#mGr'),gt:g('#mGt'),gbg:g('#mGbg'),ph:g('#playhead'),segs:[...profileBox.querySelectorAll('.tseg')],note:g('#tlnote'),svg:g('svg.mouth')};
 const pins=d.passiveTarget.split(' + ').map(k=>PIN[k]);
 const dots=E.dots.map((_,i)=>({s:i*.07,r:Math.random(),hide:false}));
 const plan=()=>{const segs=[{k:'in',dur:SLOW>1?450:200,pose:ph[0][2],air:null}];
  ph.forEach((p,i)=>segs.push({k:'ph',i,pose:p[2],c:p[3],air:p[4],dur:p[1]==null?1600:Math.max(p[1]*SLOW,SLOW>1?320:45)}));
  segs.push({k:'out',dur:450,pose:'REST'},{k:'wait',dur:500,pose:'REST'});return segs};
 let segs=plan(),t0=performance.now(),last=t0,mode=null,sl=SLOW,route=[],cum=[],sPin=0;
 E.note.textContent=SLOW>1?'Slow-motion ×10. Real time is 10× faster.':'Real speed.';
 function pose(name){return POSE[name]}
 function buildRoute(P){
  const lowTop=146+P[10],pts=[[231,152],[222,138]];
  const ty=x=>{const X=[P[0],P[2],P[4],P[6],P[8]],Y=[P[1],P[3],P[5],P[7],P[9]];if(x<=X[0])return Y[0];for(let i=1;i<5;i++)if(x<=X[i])return lerp(Y[i-1],Y[i],(x-X[i-1])/(X[i]-X[i-1]));return Y[4]};
  [204,190,176,162,148,134,120,106,92,80,70].forEach(x=>pts.push([x,(interp(ROOF,x)+ty(x))/2]));
  pts.push([58,(128+lowTop)/2],[42,(127+lowTop+6-4)/2]);
  route=pts;cum=[0];for(let i=1;i<pts.length;i++)cum[i]=cum[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);
  const p=pins[pins.length-1];let best=0,bd=1e9;pts.forEach((q,i)=>{const dd=Math.abs(q[0]-p[0]);if(dd<bd){bd=dd;best=i}});sPin=cum[best]/cum[cum.length-1];
 }
 const at=(s)=>{const L=cum[cum.length-1]*clamp(s,0,1);let i=1;while(i<cum.length-1&&cum[i]<L)i++;const f=(L-cum[i-1])/((cum[i]-cum[i-1])||1);return[lerp(route[i-1][0],route[i][0],f),lerp(route[i-1][1],route[i][1],f)]};
 const NOSE=[[231,152],[228,128],[222,106],[214,88],[190,72],[140,62],[90,62],[52,68]],nc=[0];for(let i=1;i<NOSE.length;i++)nc[i]=nc[i-1]+Math.hypot(NOSE[i][0]-NOSE[i-1][0],NOSE[i][1]-NOSE[i-1][1]);
 const nat=(s)=>{const L=nc[nc.length-1]*clamp(s,0,1);let i=1;while(i<nc.length-1&&nc[i]<L)i++;const f=(L-nc[i-1])/(nc[i]-nc[i-1]);return[lerp(NOSE[i-1][0],NOSE[i][0],f),lerp(NOSE[i-1][1],NOSE[i][1],f)]};
 function tonguePath(P){const p=[[P[0],P[1]],[P[2],P[3]],[P[4],P[5]],[P[6],P[7]],[P[8],P[9]]],m=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2],j=P[10]*.5;
  let s=`M${p[0]} L${m(p[0],p[1])}`;for(let i=1;i<4;i++)s+=` Q${p[i]} ${m(p[i],p[i+1])}`;
  return s+` L${p[4]} L204 ${194+j} L86 ${190+j} Q68 ${172} ${p[0]}Z`}
 function paint(P,segInfo,time){
  const jaw=P[10],lx=40-8*P[13]+3*P[14],rx=7+3*P[13],ry=10-2.5*P[14];
  E.tongue.setAttribute('d',tonguePath(P));E.jaw.setAttribute('transform',`translate(0,${jaw})`);
  E.up.setAttribute('cx',lx);E.up.setAttribute('cy',117);E.up.setAttribute('rx',rx);E.up.setAttribute('ry',ry);
  E.lo.setAttribute('cx',lx+P[11]);E.lo.setAttribute('cy',152+jaw+P[12]);E.lo.setAttribute('rx',rx);E.lo.setAttribute('ry',ry);
  const v=P[15],tx=lerp(222,206,v),ty=lerp(94,126,v);E.vel.setAttribute('d',`M182 101Q${(182+tx)/2} ${(101+ty)/2-6} ${tx} ${ty}`);E.uv.setAttribute('cx',tx);E.uv.setAttribute('cy',ty);
  E.gate.textContent=v>.5?'nose gate: OPEN':'nose gate: closed';E.gate.style.fill=v>.5?'#66bb6a':'#c9bea9';
  const on=segInfo&&segInfo.k==='ph'&&d.voicing.voiced;E.buzz.classList.toggle('on',!!on);
  const c=segInfo&&segInfo.k==='ph'?segInfo.c:null;
  gp.forEach((n,i)=>{n.style.setProperty('--pc',CL[c||(d.contact==='open'?'o':d.contact==='near-touch'?'n':'f')]);n.classList.toggle('idle',!c)});
  const pc=c||'f',p0=pins[0],gx=clamp(p0[0]+12,4,226),gy=clamp(p0[1]-30,4,200),gap=pc==='f'?0:pc==='n'?3:11;
  E.gauge.setAttribute('transform',`translate(${gx},${gy})`);E.gr.setAttribute('d',`M4 ${4}h6M4 ${4+gap}h6M7 4v${gap}`);
  E.gt.textContent=pc==='f'?'0 mm':pc==='n'?(d.gapMm?'~'+d.gapMm+' mm':'hair gap'):'open';E.gbg.setAttribute('width',pc==='o'?36:pc==='n'?(d.gapMm?50:56):38);E.gauge.style.opacity=c?1:.35;
  buildRoute(P);airStep(segInfo,time);
 }
 function airStep(si,time){
  const m=si&&si.k==='ph'?si.air:null,dt=Math.min(.05,(time-last)/1000);
  if(m!==mode){const pm=mode;mode=m;dots.forEach((o,i)=>{o.hide=false;if(m==='puff')o.s=sPin+i*.008;else if(m==='hiss'&&pm==='bunch')o.s=Math.max(0,sPin-i*.017);else if(m==='bunch'||m==='hiss'||m==='side'||m==='nasal'||m==='flow')o.s=i*.07})}
  E.dots.forEach((n,i)=>{const o=dots[i];if(!m||o.hide){n.style.opacity=0;return}
   const nearv=Math.abs(o.s-sPin)<.08;let sp=.32;
   if(m==='bunch'){o.s=Math.min(o.s+sp*dt*1.4,Math.max(0,sPin-i*.017))}
   else if(m==='burst'){o.s=Math.max(o.s,sPin)+dt*2.4;if(o.s>1.04)o.hide=true}
   else if(m==='puff'){o.s+=dt*.6;if(o.s>1.02)o.hide=true}
   else{if(m==='hiss'&&nearv)sp*=1.9;o.s+=sp*dt;if(o.s>1.03)o.s=0}
   let P=m==='nasal'?nat(o.s):at(o.s),r=3.2;
   if(m==='hiss'){if(nearv)r=2;else if(o.s>sPin)P[1]+=Math.sin((o.s-sPin)*70+time/90)*3.6}
   if(m==='burst')P[1]+=(o.r-.5)*46*Math.max(0,o.s-sPin);
   if(m==='side'){const b=Math.max(0,1-Math.abs(o.s-sPin)/.12);P[1]+=(i%2?-1:1)*9*b}
   n.setAttribute('cx',P[0]);n.setAttribute('cy',P[1]);n.setAttribute('r',r);n.style.opacity=o.s>1.01?0:1});
 }
 let curPose=pose('REST');
 function frame(now){
  if(!profileBox.isConnected)return;
  if(sl!==SLOW){sl=SLOW;segs=plan();t0=now;sb.setAttribute('aria-pressed',SLOW>1);sb.textContent=SLOW>1?'🐢 Slow-motion ×10':'⚡ Real speed';E.note.textContent=SLOW>1?'Slow-motion ×10. Real time is 10× faster.':'Real speed.'}
  let t=now-t0;const tot=segs.reduce((a,s)=>a+s.dur,0);if(t>=tot){t0=now;t=0;mode=null}
  let acc2=0,idx=0;for(;idx<segs.length;idx++){if(t<acc2+segs[idx].dur)break;acc2+=segs[idx].dur}
  const sg=segs[Math.min(idx,segs.length-1)],f=(t-acc2)/sg.dur,from=idx===0?pose('REST'):pose(segs[idx-1].pose),to=pose(sg.pose);
  const tw=sg.k==='ph'&&sg.air==='burst'?.8:sg.k==='ph'?.3:1,e=ease(clamp(f/tw,0,1));
  curPose=from.map((a,i)=>lerp(a,to[i],e));paint(curPose,sg,now);last=now;
  if(sg.k==='ph'){const s=E.segs[sg.i];E.ph.style.opacity=1;E.ph.style.left=(s.offsetLeft+s.offsetWidth*clamp(f,0,1))+'px'}else E.ph.style.opacity=0;
  raf=requestAnimationFrame(frame);
 }
 if(REDUCE){const P=pose(ph[0][2]);buildRoute(P);paint(P,{k:'ph',c:ph[0][3],air:null},performance.now());E.ph.style.opacity=0}
 else raf=requestAnimationFrame(frame);
 profileBox.querySelector('#aReplay').onclick=()=>{say(c.word);t0=performance.now();mode=null;if(REDUCE){const P=pose(ph[0][2]);paint(P,{k:'ph',c:ph[0][3],air:'hiss'},performance.now())}};
 const sb=profileBox.querySelector('#aSlow');sb.onclick=()=>{SLOW=SLOW>1?1:10};
 if(infoEl)info(c,d,infoEl,accentOf);
}
/* ===== 6. INFO PANEL ===== */
function info(c,d,infoEl,accentOf){
 const hold=d.release==='pop-then-hiss'?`touch ${d.holdMs[0]}–${d.holdMs[1]} ms, then hiss ~${d.hissMs} ms`:d.holdMs?(d.contact==='open'?`glide ${d.holdMs[0]}–${d.holdMs[1]} ms into the vowel`:`${d.holdMs[0]}–${d.holdMs[1]} ms — faster than a blink!`):d.contact==='open'&&d.ipa==='j'?'a quick glide into the vowel':'as long as your breath lasts';
 const touch=d.contact==='open'?`${d.activeArticulator} near ${d.passiveTarget} · <b>NO TOUCH</b>`:`${d.activeArticulator} → ${d.passiveTarget} · <b>${LT[d.contact]}${d.contact===nT&&d.gapMm?' (gap ~'+d.gapMm+' mm)':d.contact===nT?' (peeks out)':''}</b>`;
 const vot=d.voicing.votMs?` · puff ~${d.voicing.votMs} ms`:'';
 const cf=(CONF[c.ipa]||[]).map(k=>{const o=C.find(x=>x.ipa===k);return o?`<button class="cfbtn" data-i="${o.i}">/${o.ipa}/ ${o.word}</button>`:''}).join('');
 infoEl.innerHTML=`<div class="symrow"><span class="sym">/${d.ipa}/</span><span class="exword">as in <b>${c.word}</b></span>
  <button class="speak" id="sBtn" aria-label="Hear the word"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9v6h4l5 4V5L8 9H4Z" stroke-linejoin="round"/><path d="M17 8.5a5 5 0 0 1 0 7M19.5 6a8 8 0 0 1 0 12" stroke-linecap="round"/></svg></button></div>
  <div class="factors">
   <span class="fchip"><span class="k">Place</span> ${PLACE[c.place].label} <em>${PG[c.place]}</em></span>
   <span class="fchip"><span class="k">Manner</span> ${MANNER[c.manner].icon} ${MANNER[c.manner].label.replace(/s$/,'')} <em>${MG[c.manner]}</em></span>
   <span class="fchip"><span class="k">Voice</span> ${d.voicing.voiced?'Voiced · buzz on':'Voiceless · no buzz'}${vot}</span></div>
  <div class="factors a2">
   <span class="fchip big"><span class="k">Touch</span> ${touch}</span>
   <span class="fchip"><span class="k">Hold</span> ${hold}</span>
   <span class="fchip"><span class="k">Air</span> ${AIRT[d.airPath]}</span>
   <span class="fchip"><span class="k">Lips</span> ${d.lipShape}</span>
   <span class="fchip"><span class="k">Tongue</span> ${d.tongueShape}</span></div>
  <div class="tryit" style="--accent:${accentOf(c)}"><div class="h">👉 You try it</div><p>${d.tryIt}</p></div>
  <div class="jp">🇯🇵 <b>Japanese tip:</b> ${d.jpTip}</div>
  ${cf?`<div class="jp conf">Often mixed up with: ${cf}</div>`:''}`;
 infoEl.querySelector('#sBtn').onclick=()=>say(c.word);
 infoEl.querySelectorAll('.cfbtn').forEach(b=>b.onclick=()=>{const n=document.querySelector(`.cchip[data-i="${b.dataset.i}"]`);n&&n.click()});
 infoEl.style.setProperty('--accent',accentOf(c));
}
window.ART={show,has:k=>!!DATA[k],DATA,POSE};
})();
