/* picture-key.js · shared by The Sound Garden 🌸 and The Sound Forge 🔥
   "Read the Picture" — the decoder for the air-road diagram.
   Asked for by Renjith, 11 Nov 2026: a child must be able to look at the diagram and know,
   on their own, what the wavy circle, the blue dots and the brown blocks mean.

   Drop-in: put  <div id="pictureKey"></div>  anywhere in the page and load this file
   with  <script src="picture-key.js" defer></script>.  No other dependency.
   It uses the site's own CSS variables, so it follows the Day / Night / Meadow skins. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';

  /* ---------- 1. the six numbered parts ---------- */
  var PARTS = [
    { n: 1, id: 'road', t: 'The air road', icon: 'road',
      en: 'This whole long tube is <b>the inside of your mouth, drawn flat</b> — like a road seen from the side. Your breath starts at your <b>throat on the left</b> and drives out through your <b>lips on the right</b>. Every single sound you make is one short trip down this road.',
      ja: '口の中を横から見た「息（いき）の道」。左が のど、右が くちびる。どんな音も、この道を通るよ。' },
    { n: 2, id: 'voice', t: 'The voice box (the wavy circle)', icon: 'voice',
      en: 'This circle is your <b>voice box</b>, deep in your throat. Inside it are two tiny rubber bands. The squiggle shows them <b>shaking</b>. When the circle is <b>gold and shaking, the buzz is ON</b> — that is b, v, z, m and <i>every single vowel</i>. When it is <b>grey and still, the buzz is OFF</b> and only plain breath goes out — that is p, f, s, sh.',
      ja: '声（こえ）のはこ。中のゴムがふるえると「ブーン」という声になる。金色でゆれていたら声あり、灰色なら息だけ。',
      feel: 'Put two fingers flat on the front of your throat. Say a long “sssss” — nothing. Now “zzzzz” — your fingers tickle! Same mouth, different voice box. <span lang="ja">のどに指をあてて、スー → ズー。ふるえるのはどっち？</span>' },
    { n: 3, id: 'air', t: 'The moving dots', icon: 'air',
      en: 'Each dot is a <b>little puff of air</b> travelling down the road, left to right. <b>Blue dots</b> are quiet breath. <b>Gold dots</b> are breath that the voice box has already turned into sound. Watch what the dots do in the middle of the road — that is the whole secret of the sound.',
      ja: '息のつぶ。青＝息だけ、金＝声つきの息。まん中で何が起きるか見てみよう。' },
    { n: 4, id: 'block', t: 'The brown blocks and the gap between them', icon: 'block',
      en: 'The brown blocks are <b>a roadblock</b>: a part of your own mouth — your <b>lips</b>, your <b>teeth</b> or your <b>tongue</b> — pushing into the road. The important thing is not the blocks, it is the <b>gap left between them: the doorway</b>.<br>• A <b>hair-thin</b> doorway → the air has to rush, and it screams: a sharp hiss (<b>s</b>, <b>z</b>).<br>• A <b>wider</b> doorway → the air still rubs past, but softly and fuzzily (<b>th</b>, <b>sh</b>).<br>• <b>No doorway at all</b> → the air is trapped and cannot get out (<b>p</b>, <b>t</b>, <b>k</b>).',
      ja: 'じゃまをするもの（くちびる・歯・舌）。大事なのは「すきま」の大きさ。細い＝するどい「スー」、広い＝やわらかい息、ゼロ＝息が止まる。',
      feel: 'Hold your palm in front of your mouth. “sss” is a thin, cold jet on one small spot. “th” is wide, warm and soft. Your hand can feel the doorway! <span lang="ja">手のひらを口の前に。つめたくて細い？ あたたかくて広い？</span>' },
    { n: 5, id: 'pop', t: 'The 💥 pop', icon: 'pop',
      en: 'The door was <b>completely shut</b>, so the air piled up behind it and the pressure grew… and then the door flies open and the air <b>bursts out</b>. That tiny explosion <i>is</i> the sound. It cannot be held or stretched — a pop is over in a blink. p, b, t, d, k, g.',
      ja: 'とじたドアの後ろに息がたまって、パッと開いてはじける。これが「ポン」の音。のばせない、一瞬の音だよ。',
      feel: 'Hold a small piece of tissue paper in front of your lips and say “pen!”. The tissue should jump. If it does not move, your pop was too gentle. <span lang="ja">ティッシュを口の前に。「pen」でゆれたら成功！</span>' },
    { n: 6, id: 'nose', t: 'The dotted pipe going up', icon: 'nose',
      en: 'Sometimes the mouth is shut tight but the sound keeps going — where did the air go? <b>Up and out through your nose.</b> The dotted pipe is the nose road. Only three English sounds use it: <b>m</b>, <b>n</b> and <b>ng</b>.',
      ja: '鼻（はな）の道。口はとじているのに音が続くのは、息が鼻から出ているから。m・n・ng の３つだけ。',
      feel: 'Hum “mmmmm”, and while you are humming, pinch your nose shut. The sound dies instantly — proof that the air was escaping up there. <span lang="ja">「ンー」と言いながら鼻をつまむと、音が止まる！</span>' }
  ];

  /* ---------- 2. the road picture ---------- */
  var MODES = {
    open:  { lab: '🌸 a vowel', sub: 'a · e · i · o · u', buzz: 1, wall: 0, badges: [1, 2, 3],
             say: 'Nothing blocks the road at all, and the buzz never stops. That is why you can hold a vowel for as long as your breath lasts: aaaaaaaa.' },
    fric:  { lab: '🐍 a hiss',  sub: 's · z · f · v',     buzz: 0, wall: 14, badges: [1, 2, 3, 4],
             say: 'A hair-thin doorway. The air must squeeze through, so it hisses. You can hold a hiss as long as you like: sssssss.' },
    fricw: { lab: '🤫 soft air', sub: 'th · sh',           buzz: 0, wall: 9, badges: [1, 2, 3, 4],
             say: 'A wider doorway. The air brushes past instead of screaming through, so it sounds soft and fuzzy.' },
    stop:  { lab: '💥 a pop',   sub: 'p · b · t · d · k · g', buzz: 0, wall: 17, badges: [1, 2, 3, 4, 5],
             say: 'The road is completely shut. Air piles up… then BANG, the door opens. Watch the dots bunch up and then shoot out.' },
    nasal: { lab: '👃 a nose hum', sub: 'm · n · ng',      buzz: 1, wall: 17, nose: 1, badges: [1, 2, 3, 4, 6],
             say: 'The mouth is shut, but the little door to the nose is open, so the air turns upward and hums out of your nose.' },
    side:  { lab: '🍭 round the sides', sub: 'l',           buzz: 1, stone: 1, badges: [1, 2, 3, 4],
             say: 'Your tongue tip is a stone in the middle of a river. The water — the air — simply flows around both sides of it.' }
  };
  var ORDER = ['open', 'fric', 'fricw', 'stop', 'nasal', 'side'];

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function svgEl(tag, attrs) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }

  /** The air road. mode = key of MODES, buzz = 0/1 override, wall = override block height, hi = part id to light up. */
  function road(mode, buzz, wall, hi, withBadges) {
    var M = MODES[mode] || MODES.open;
    if (buzz == null) buzz = M.buzz;
    if (wall == null) wall = M.wall || 0;
    var s = svgEl('svg', { viewBox: '0 0 320 92', class: 'pk-road', role: 'img', 'aria-label': 'The air road: ' + M.lab });
    var g = function (n, a) { var e = svgEl(n, a); s.appendChild(e); return e; };
    g('rect', { x: 40, y: 24, width: 270, height: 34, rx: 17, class: 'pk-tube' + (hi === 'road' ? ' hi' : '') });
    if (mode === 'open') g('path', { d: 'M40 30 Q175 18 308 28 M40 52 Q175 64 308 54', class: 'pk-free' });
    if (M.nose) g('path', { d: 'M140 24 L140 12 L310 12', class: 'pk-nose' + (hi === 'nose' ? ' hi' : '') });
    if (M.stone) g('circle', { cx: 170, cy: 41, r: 9, class: 'pk-stone' + (hi === 'block' ? ' hi' : '') });
    else if (wall > 0) {
      var wc = 'pk-wall' + (hi === 'block' ? ' hi' : '');
      g('rect', { x: 166, y: 24, width: 8, height: wall, class: wc });
      g('rect', { x: 166, y: 58 - wall, width: 8, height: wall, class: wc });
    }
    if (mode === 'stop') { var b = g('text', { x: 186, y: 32, class: 'pk-boom' }); b.textContent = '💥'; }
    var th = g('g', { class: 'pk-throat' + (buzz ? ' buzz' : '') + (hi === 'voice' ? ' hi' : '') });
    th.appendChild(svgEl('circle', { cx: 20, cy: 41, r: 13 }));
    th.appendChild(svgEl('path', { d: 'M11 41 q3 -6 6 0 q3 6 6 0 q3 -6 6 0' }));
    var anim = mode === 'open' ? 'float' : mode === 'side' ? 'side' : mode;
    for (var i = 0; i < 7; i++) {
      var d = g('circle', { cx: 44, cy: 41, r: 4, class: 'pk-dot pk-' + (anim === 'side' ? (i % 2 ? 'sideu' : 'sided') : anim) + (buzz ? ' buzz' : '') + (hi === 'air' ? ' hi' : '') });
      d.style.animationDelay = (i * 0.37).toFixed(2) + 's';
    }
    if (withBadges) (M.badges || []).forEach(function (n) {
      var P = { 1: [290, 76], 2: [20, 13], 3: [56, 76], 4: [170, 76], 5: [206, 18], 6: [262, 26] }[n];
      var bg = g('g', { class: 'pk-badge' + (hi === PARTS[n - 1].id ? ' on' : '') });
      bg.appendChild(svgEl('circle', { cx: P[0], cy: P[1], r: 8 }));
      var t = svgEl('text', { x: P[0], y: P[1] + 3.6, 'text-anchor': 'middle' }); t.textContent = n; bg.appendChild(t);
    });
    return s;
  }

  var ICON = {
    road: '<svg viewBox="0 0 60 30" class="pk-ic"><rect x="4" y="8" width="52" height="14" rx="7" class="pk-tube"/></svg>',
    voice: '<svg viewBox="0 0 60 30" class="pk-ic"><g class="pk-throat buzz"><circle cx="30" cy="15" r="11"/><path d="M22 15 q2.7 -5 5.3 0 q2.7 5 5.3 0 q2.7 -5 5.3 0"/></g></svg>',
    air: '<svg viewBox="0 0 60 30" class="pk-ic"><circle cx="14" cy="15" r="4.5" class="pk-sdot"/><circle cx="30" cy="15" r="4.5" class="pk-sdot"/><circle cx="46" cy="15" r="4.5" class="pk-sdot gold"/></svg>',
    block: '<svg viewBox="0 0 60 30" class="pk-ic"><rect x="4" y="8" width="52" height="14" rx="7" class="pk-tube"/><rect x="27" y="8" width="7" height="5" class="pk-wall"/><rect x="27" y="17" width="7" height="5" class="pk-wall"/></svg>',
    pop: '<svg viewBox="0 0 60 30" class="pk-ic"><rect x="4" y="8" width="52" height="14" rx="7" class="pk-tube"/><rect x="18" y="8" width="7" height="14" class="pk-door"/><text x="33" y="21" font-size="13">💥</text></svg>',
    nose: '<svg viewBox="0 0 60 30" class="pk-ic"><rect x="4" y="13" width="52" height="12" rx="6" class="pk-tube"/><path d="M26 13 L26 5 L56 5" class="pk-nose"/></svg>'
  };

  /* ---------- 3. the doorway slider ---------- */
  var GAPS = [
    { lab: 'SHUT', mode: 'stop', wall: 17, sound: 'p · t · k', en: 'No doorway at all. The air is trapped, the pressure builds, and then the door bursts open: POP!', ja: 'すきまゼロ → たまって、ポン！' },
    { lab: 'HAIR-THIN', mode: 'fric', wall: 14, sound: 's · z', en: 'A doorway as thin as a hair. The air has to rush through, so it screams — a sharp snake hiss.', ja: '細いすきま → するどい「スー」。' },
    { lab: 'A BIT WIDER', mode: 'fricw', wall: 9, sound: 'th · sh', en: 'A wider doorway. The air still rubs on the way past, but gently — a soft, fuzzy sound.', ja: '少し広い → やわらかい息。' },
    { lab: 'WIDE OPEN', mode: 'open', wall: 0, sound: 'a · e · i · o · u', en: 'No roadblock left. The air strolls straight out and you hear a vowel. You are back in The Sound Garden! 🌸', ja: 'すっかり広い → 母音（ぼいん）になる。' }
  ];

  /* ---------- 4. build ---------- */
  function build(host) {
    var mode = 'fric', buzz = null, hi = '', locked = false;
    host.classList.add('pk');
    host.innerHTML = '';

    var head = el('div', 'pk-head',
      '<h2>📖 Read the Picture <span class="pk-em">— what every mark on the air road means</span></h2>' +
      '<p>Everywhere on this site (and in the Learning Hub app) you will meet this same picture. ' +
      'Once you can read it, you can work out <b>any</b> sound by yourself — even one nobody has taught you. ' +
      'Tap a sound type to change the road, then tap a numbered card to find that part in the picture.<br>' +
      '<span lang="ja">この絵が読めるようになれば、どんな音でも自分でわかるよ。音のタイプをえらんで、番号のカードをタップしてみよう。</span></p>');
    host.appendChild(head);

    var chips = el('div', 'pk-chips');
    ORDER.forEach(function (k) {
      var b = el('button', 'pk-chip' + (k === mode ? ' on' : ''), MODES[k].lab + '<small>' + MODES[k].sub + '</small>');
      b.setAttribute('aria-pressed', k === mode); b.dataset.k = k;
      b.onclick = function () { mode = k; buzz = null; hi = ''; locked = false; render(); };
      chips.appendChild(b);
    });
    host.appendChild(chips);

    var stage = el('div', 'pk-stage'); host.appendChild(stage);
    var says = el('p', 'pk-say'); host.appendChild(says);

    var sw = el('div', 'pk-switchrow');
    var swb = el('button', 'pk-switch', '<span class="pk-knob"></span><span class="pk-swtxt"></span>');
    var swc = el('span', 'pk-swcap', '');
    swb.onclick = function () {
      if (mode === 'open' || mode === 'nasal') { sw.classList.add('shake'); setTimeout(function () { sw.classList.remove('shake'); }, 700); locked = true; swc.innerHTML = '<b class="pk-no">You cannot switch it off! A vowel or a nose hum with no voice is only a whisper. <span lang="ja">これは声を切れないよ。</span></b>'; return; }
      buzz = (buzz == null ? MODES[mode].buzz : buzz) ? 0 : 1; render();
    };
    sw.appendChild(swb); sw.appendChild(swc); host.appendChild(sw);

    var list = el('ul', 'pk-list'); host.appendChild(list);
    PARTS.forEach(function (p) {
      var li = el('li', 'pk-card', '<span class="pk-n">' + p.n + '</span>' + ICON[p.icon] +
        '<div class="pk-txt"><b class="pk-t">' + p.t + '</b><p>' + p.en + '</p><p lang="ja" class="pk-ja">' + p.ja + '</p>' +
        (p.feel ? '<p class="pk-feel">✋ <b>Try it right now:</b> ' + p.feel + '</p>' : '') + '</div>');
      li.dataset.id = p.id;
      li.onclick = function () { hi = (hi === p.id ? '' : p.id); render(); };
      list.appendChild(li);
    });

    /* doorway slider */
    var gi = 1;
    var slide = el('div', 'pk-slide',
      '<b>🎚️ The doorway slider</b> — open the gap step by step and watch the sound change its name. ' +
      '<span lang="ja">すきまを大きくすると、音の名前が変わるよ。</span>' +
      '<div class="pk-sstage"></div>' +
      '<input type="range" min="0" max="3" step="1" value="1" class="pk-range" aria-label="How wide is the doorway?">' +
      '<div class="pk-slabs"></div><p class="pk-swhy"></p>');
    host.appendChild(slide);
    var sStage = slide.querySelector('.pk-sstage'), sRange = slide.querySelector('.pk-range'),
        sLabs = slide.querySelector('.pk-slabs'), sWhy = slide.querySelector('.pk-swhy');
    GAPS.forEach(function (g, k) {
      var s = el('span', 'pk-slab' + (k === gi ? ' on' : ''), g.lab);
      s.onclick = function () { gi = k; sRange.value = k; drawSlide(); };
      sLabs.appendChild(s);
    });
    sRange.oninput = function () { gi = +sRange.value; drawSlide(); };
    function drawSlide() {
      var g = GAPS[gi];
      sStage.innerHTML = ''; sStage.appendChild(road(g.mode, 0, g.wall, '', false));
      [].forEach.call(sLabs.children, function (c, k) { c.classList.toggle('on', k === gi); });
      sWhy.innerHTML = '<b class="pk-sname">' + g.sound + '</b> — ' + g.en + ' <span lang="ja">' + g.ja + '</span>';
    }

    host.appendChild(el('p', 'pk-foot',
      '🌸 <b>Vowels</b> are the sounds with an <b>empty road</b>: nothing touches, the buzz stays on, and you can hold them forever. ' +
      'They are what <b>The Sound Garden</b> is about — there you learn the <i>shape</i> your tongue and lips give the empty road.<br>' +
      '🔥 <b>Consonants</b> are the sounds that <b>put something in the road</b>: a block, a doorway, a stone, a detour through the nose. ' +
      'That is what <b>The Sound Forge</b> is about.<br>' +
      '<b>Every word you say is these two taking turns.</b> <span lang="ja">母音＝道はカラッポ。子音＝道に何かおく。ことばは、このくりかえし！</span>'));

    function render() {
      var M = MODES[mode];
      [].forEach.call(chips.children, function (c) { var on = c.dataset.k === mode; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on); });
      stage.innerHTML = ''; stage.appendChild(road(mode, buzz, null, hi, true));
      says.innerHTML = M.say;
      var b = buzz == null ? M.buzz : buzz;
      swb.classList.toggle('on', !!b);
      swb.setAttribute('aria-pressed', !!b);
      swb.querySelector('.pk-swtxt').textContent = b ? '🐝 BUZZ ON' : '🤫 buzz off';
      if (!locked) swc.innerHTML = (mode === 'open' || mode === 'nasal')
          ? 'Try switching the buzz off… <span lang="ja">声を切ってみて！</span>'
          : 'Same mouth, same roadblock — flip only the throat and you get the other sound of the pair (s↔z, f↔v, p↔b). <span lang="ja">口は同じ。のどだけ変える。</span>';
      [].forEach.call(list.children, function (c) { c.classList.toggle('on', c.dataset.id === hi); });
    }
    render(); drawSlide();
  }

  /* ---------- 5. styles (uses the host site's own CSS variables) ---------- */
  var CSS = [
    '.pk{display:block;margin:28px auto;max-width:1040px;background:var(--panel,#1c140b);border:2px solid var(--border,#4a3c28);border-radius:20px;padding:18px 18px 20px;color:var(--parchment,#f4ecdc);line-height:1.55}',
    '.pk-head h2{margin:0 0 6px;font-family:var(--font-display,Georgia,serif);font-size:1.5rem}',
    '.pk-em{color:var(--parchment-dim,#c9bea9);font-weight:400;font-size:1rem}',
    '.pk-head p{margin:0 0 10px;color:var(--parchment-dim,#c9bea9)}',
    '.pk-chips{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}',
    '.pk-chip{display:flex;flex-direction:column;align-items:flex-start;gap:1px;min-height:48px;padding:7px 14px;border-radius:999px;border:2px solid var(--border,#4a3c28);background:var(--panel-2,#221810);color:var(--parchment,#f4ecdc);font-weight:800}',
    '.pk-chip small{color:var(--parchment-faint,#8d8371);font-family:var(--font-mono,monospace);font-size:.72rem;font-weight:600}',
    '.pk-chip.on{border-color:var(--bud-amber,#e7ac5f);background:var(--bud-amber,#e7ac5f);color:#1a1004}.pk-chip.on small{color:#3a2a0a}',
    '.pk-stage{background:var(--panel-2,#221810);border:2px solid var(--border-soft,#3a2f1f);border-radius:16px;padding:8px}',
    '.pk-road{width:100%;height:auto;max-height:11rem;display:block}',
    '.pk-say{margin:8px 0 2px;color:var(--parchment,#f4ecdc)}',
    '.pk-tube{fill:var(--soil-900,#181209);stroke:var(--border,#4a3c28);stroke-width:2}',
    '.pk-tube.hi,.pk-wall.hi,.pk-stone.hi,.pk-nose.hi{stroke:var(--bud-amber,#e7ac5f);stroke-width:3}',
    '.pk-free{fill:none;stroke:var(--root-blue,#74a3d9);stroke-width:1.6;stroke-dasharray:3 5;opacity:.65}',
    '.pk-wall{fill:var(--clay,#d67243)}.pk-door{fill:#ff8787}.pk-stone{fill:var(--clay,#d67243)}',
    '.pk-nose{fill:none;stroke:var(--bud-amber,#e7ac5f);stroke-width:2;stroke-dasharray:4 4}',
    '.pk-boom{font-size:16px;opacity:0;animation:pk-boom 2.6s linear infinite}',
    '.pk-throat circle{fill:var(--panel-2,#221810);stroke:var(--border,#4a3c28);stroke-width:2}',
    '.pk-throat path{fill:none;stroke:var(--parchment-faint,#8d8371);stroke-width:2}',
    '.pk-throat.buzz path{stroke:var(--bud-amber,#e7ac5f);animation:pk-buzz .12s linear infinite;transform-box:fill-box;transform-origin:center}',
    '.pk-throat.hi circle{stroke:var(--bud-amber,#e7ac5f);stroke-width:3}',
    '.pk-dot{fill:var(--root-blue,#74a3d9);opacity:0;animation-duration:2.6s;animation-iteration-count:infinite;animation-timing-function:linear}',
    '.pk-dot.buzz{fill:var(--bud-amber,#e7ac5f)}.pk-dot.hi{stroke:#fff;stroke-width:1.5}',
    '.pk-float{animation-name:pk-float}.pk-fric{animation-name:pk-fric}.pk-fricw{animation-name:pk-fricw}',
    '.pk-stop{animation-name:pk-stop}.pk-nasal{animation-name:pk-nasal}.pk-sideu{animation-name:pk-sideu}.pk-sided{animation-name:pk-sided}',
    '.pk-badge circle{fill:var(--bud-amber,#e7ac5f);stroke:#1a1004;stroke-width:1.2}',
    '.pk-badge text{font-size:9.5px;font-weight:900;fill:#1a1004}',
    '.pk-badge.on circle{fill:#fff}',
    '.pk-switchrow{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:10px 0}',
    '.pk-switchrow.shake{animation:pk-shake .3s 2}',
    '.pk-switch{display:inline-flex;align-items:center;gap:8px;min-height:48px;padding:6px 16px 6px 7px;border-radius:999px;border:3px solid var(--border,#4a3c28);background:var(--panel-2,#221810);color:var(--parchment-dim,#c9bea9);font-weight:900}',
    '.pk-switch.on{border-color:var(--bud-amber,#e7ac5f);color:var(--bud-amber,#e7ac5f)}',
    '.pk-knob{width:22px;height:22px;border-radius:50%;background:var(--parchment-faint,#8d8371);transition:background .18s,transform .18s}',
    '.pk-switch.on .pk-knob{background:var(--bud-amber,#e7ac5f);transform:translateX(3px)}',
    '.pk-swcap{flex:1 1 14rem;color:var(--parchment-dim,#c9bea9);font-size:.95rem}.pk-no{color:var(--clay,#d67243)}',
    '.pk-list{list-style:none;margin:14px 0 0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:10px}',
    '.pk-card{display:grid;grid-template-columns:auto auto minmax(0,1fr);gap:10px;align-items:start;background:var(--panel-2,#221810);border:2px solid var(--border-soft,#3a2f1f);border-radius:14px;padding:10px 12px;cursor:pointer}',
    '.pk-card.on{border-color:var(--bud-amber,#e7ac5f);box-shadow:0 0 0 2px rgba(231,172,95,.25)}',
    '.pk-card:hover{border-color:var(--border,#4a3c28)}',
    '.pk-n{width:30px;height:30px;border-radius:50%;background:var(--bud-amber,#e7ac5f);color:#1a1004;font-weight:900;display:grid;place-items:center}',
    '.pk-ic{width:66px;height:33px;background:var(--soil-900,#181209);border:2px solid var(--border-soft,#3a2f1f);border-radius:8px}',
    '.pk-sdot{fill:var(--root-blue,#74a3d9)}.pk-sdot.gold{fill:var(--bud-amber,#e7ac5f)}',
    '.pk-txt p{margin:4px 0 0;font-size:.95rem}.pk-t{font-size:1.02rem;color:var(--bud-amber,#e7ac5f)}',
    '.pk-ja{color:var(--parchment-dim,#c9bea9)}.pk-feel{color:var(--moss,#93b26a)}',
    '.pk-slide{margin-top:14px;background:var(--panel-2,#221810);border:2px solid var(--border-soft,#3a2f1f);border-radius:14px;padding:10px 12px 12px}',
    '.pk-sstage{margin:6px 0}.pk-range{width:100%;height:2rem;accent-color:var(--bud-amber,#e7ac5f)}',
    '.pk-slabs{display:flex;justify-content:space-between;gap:4px;font-size:.74rem;font-weight:800;color:var(--parchment-faint,#8d8371)}',
    '.pk-slab{flex:1;text-align:center;cursor:pointer}.pk-slab.on{color:var(--bud-amber,#e7ac5f)}',
    '.pk-swhy{margin:8px 0 0;font-size:.96rem}.pk-sname{font-family:var(--font-mono,monospace);color:var(--bud-amber,#e7ac5f)}',
    '.pk-foot{margin:14px 0 0;padding-top:12px;border-top:2px dashed var(--border,#4a3c28);font-size:.97rem}',
    '.twohalves{max-width:1040px;margin:22px auto;padding:0 2px}',
    '.twohalves h2{font-family:var(--font-display,Georgia,serif);font-size:1.3rem;margin:0 0 10px;color:var(--parchment,#f4ecdc)}',
    '.halves{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px}',
    '.half{display:flex;flex-direction:column;gap:7px;background:var(--panel,#1c140b);border:3px solid var(--border,#4a3c28);border-radius:18px;padding:14px 16px;color:var(--parchment,#f4ecdc);text-decoration:none}',
    '.half.g{border-color:var(--moss-deep,#6f9048)}.half.f{border-color:var(--clay,#d67243)}',
    '.half b{font-size:1.08rem}.half span{color:var(--parchment-dim,#c9bea9);font-size:.96rem;line-height:1.55}',
    '.half em{color:var(--bud-amber,#e7ac5f);font-style:normal;font-weight:800}',
    '.half:hover{border-color:var(--bud-amber,#e7ac5f)}',
    '.hnote{max-width:1040px;margin:10px auto 0;color:var(--parchment-dim,#c9bea9);font-size:.96rem}',
    '@keyframes pk-buzz{0%,100%{transform:translateY(-1px)}50%{transform:translateY(1px)}}',
    '@keyframes pk-boom{0%,55%{opacity:0}62%{opacity:1;font-size:21px}76%,100%{opacity:0;font-size:16px}}',
    '@keyframes pk-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}',
    '@keyframes pk-float{0%{transform:translate(0,0);opacity:0}8%{opacity:1}92%{opacity:1}100%{transform:translate(258px,0);opacity:0}}',
    '@keyframes pk-fric{0%{transform:translate(0,0);opacity:0}8%{opacity:1}44%{transform:translate(118px,0) scale(1)}50%{transform:translate(126px,0) scale(.6)}58%{transform:translate(150px,-5px)}66%{transform:translate(175px,5px)}74%{transform:translate(200px,-5px)}82%{transform:translate(222px,5px)}92%{opacity:1}100%{transform:translate(258px,0);opacity:0}}',
    '@keyframes pk-fricw{0%{transform:translate(0,0);opacity:0}8%{opacity:1}44%{transform:translate(118px,0)}58%{transform:translate(150px,-9px)}70%{transform:translate(185px,9px)}82%{transform:translate(222px,-9px)}92%{opacity:1}100%{transform:translate(258px,0);opacity:0}}',
    '@keyframes pk-stop{0%{transform:translate(0,0);opacity:0}8%{opacity:1}40%{transform:translate(112px,0)}64%{transform:translate(118px,0) scale(1.25)}70%{transform:translate(150px,0)}92%{opacity:1}100%{transform:translate(258px,0);opacity:0}}',
    '@keyframes pk-nasal{0%{transform:translate(0,0);opacity:0}8%{opacity:1}34%{transform:translate(94px,0)}46%{transform:translate(96px,-29px)}92%{opacity:1}100%{transform:translate(258px,-29px);opacity:0}}',
    '@keyframes pk-sideu{0%{transform:translate(0,0);opacity:0}8%{opacity:1}40%{transform:translate(100px,0)}50%{transform:translate(126px,-12px)}60%{transform:translate(152px,0)}92%{opacity:1}100%{transform:translate(258px,0);opacity:0}}',
    '@keyframes pk-sided{0%{transform:translate(0,0);opacity:0}8%{opacity:1}40%{transform:translate(100px,0)}50%{transform:translate(126px,12px)}60%{transform:translate(152px,0)}92%{opacity:1}100%{transform:translate(258px,0);opacity:0}}',
    '@media (max-width:640px){.pk{padding:14px 12px 16px;border-radius:16px}.pk-card{grid-template-columns:auto minmax(0,1fr)}.pk-card .pk-ic{grid-column:1/-1;width:100%;max-width:120px}}',
    '@media (prefers-reduced-motion:reduce){.pk-dot,.pk-boom,.pk-throat.buzz path,.pk-switchrow.shake{animation:none!important}.pk-dot{opacity:.9}}'
  ].join('\n');

  function init() {
    var host = document.getElementById('pictureKey');
    if (!host) return;
    if (!document.getElementById('pk-style')) {
      var st = document.createElement('style'); st.id = 'pk-style'; st.textContent = CSS; document.head.appendChild(st);
    }
    build(host);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.PictureKey = { init: init, PARTS: PARTS };
})();
