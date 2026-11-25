/* =====================================================================
   THE FOLEY ART — Workshop presentation
   ---------------------------------------------------------------------
   ✏️  EDIT HERE: everything you will normally want to change lives in
   the CONFIG section right below (track titles, guess cards, keys).
   Media files go in the assets/ folder — see assets/README.md.
   ===================================================================== */

/* =====================================================================
   CONFIG — Slide 5: music tracks
   - title:    shown in the music panel (Hebrew or English)
   - subtitle: small second line (genre / mood) — can be ""
   - src:      path to the MP3 inside assets/
   Add or remove rows freely; the panel builds itself from this list.
   ===================================================================== */
const MUSIC_TRACKS = [
  { title: "רצועה 1 — מתח",       subtitle: "Suspense · Strings", src: "assets/track1.mp3" },
  { title: "רצועה 2 — קומדיה",    subtitle: "Comedy · Pizzicato", src: "assets/track2.mp3" },
  { title: "רצועה 3 — הרפתקה",    subtitle: "Adventure · Orchestral", src: "assets/track3.mp3" },
];

/* Label of the "no music" row (keeps the scene fully silent) */
const NO_MUSIC_LABEL = "ללא מוזיקה (שקט מוחלט)";

/* =====================================================================
   CONFIG — Slide 4: "Guess the sound" flip cards (4–6 recommended)
   - frontImage: frame/thumbnail from the video (front of the card)
   - question:   text under the "?" on the front
   - answer:     the real object/prop (back of the card, big text)
   - sound:      what it sounded like on screen (back, small text)
   - backImage:  photo of the prop (back of the card)
   If an image file is missing the card shows a neat placeholder icon.
   ===================================================================== */
const GUESS_CARDS = [
  {
    frontImage: "assets/cards/card1-front.jpg",
    question: "ממה עשוי הצליל?",
    answer: "תפוח אדמה ושקית קמח",
    sound: "צעדים בשלג",
    backImage: "assets/cards/card1-prop.jpg",
  },
  {
    frontImage: "assets/cards/card2-front.jpg",
    question: "ממה עשוי הצליל?",
    answer: "כרוב שנשבר",
    sound: "עצם נשברת",
    backImage: "assets/cards/card2-prop.jpg",
  },
  {
    frontImage: "assets/cards/card3-front.jpg",
    question: "ממה עשוי הצליל?",
    answer: "שתי קליפות קוקוס",
    sound: "פרסות סוס",
    backImage: "assets/cards/card3-prop.jpg",
  },
  {
    frontImage: "assets/cards/card4-front.jpg",
    question: "ממה עשוי הצליל?",
    answer: "מטריה נפתחת",
    sound: "משק כנפי ציפור",
    backImage: "assets/cards/card4-prop.jpg",
  },
  {
    frontImage: "assets/cards/card5-front.jpg",
    question: "ממה עשוי הצליל?",
    answer: "צלופן מקומט",
    sound: "אש מתפצפצת",
    backImage: "assets/cards/card5-prop.jpg",
  },
  {
    frontImage: "assets/cards/card6-front.jpg",
    question: "ממה עשוי הצליל?",
    answer: "קלטת וידאו ישנה",
    sound: "הליכה בשדה עשב",
    backImage: "assets/cards/card6-prop.jpg",
  },
];

/* =====================================================================
   CONFIG — Behaviour
   ===================================================================== */
const SETTINGS = {
  /* Hebrew RTL: Left arrow = NEXT slide, Right arrow = PREVIOUS slide.
     Set to false if you prefer Right arrow = next.                    */
  rtlArrows: true,

  /* Slide 5 timecode is MM:SS:FF (minutes:seconds:frames). */
  timecodeFps: 25,

  /* Seconds jumped by ← / → on slide 5. */
  stepSeconds: 1,

  /* true  = music position follows the video position (scrub the video
             back to 0:10 and the music also restarts from 0:10).
     false = music just plays/pauses with the video from wherever it is. */
  musicFollowsVideoTime: true,

  /* Initial music volume (0–1). */
  musicVolume: 0.8,
};

/* =====================================================================
   ⚠️  You normally don't need to edit anything below this line.
   ===================================================================== */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const pad = (n) => String(Math.floor(n)).padStart(2, "0");
const fmtShort = (t) => (isFinite(t) ? `${pad(t / 60)}:${pad(t % 60)}` : "00:00");
const fmtTc = (t, fps = SETTINGS.timecodeFps) => {
  if (!isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60), s = Math.floor(t % 60), f = Math.floor((t % 1) * fps);
  return `${pad(m)}:${pad(s)}:${pad(f)}`;
};
const isTyping = (el) =>
  el && (el.tagName === "INPUT" && !["range", "checkbox", "radio", "button"].includes(el.type) ||
         el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);

/* ---------- Fullscreen helpers (with CSS fallback for iOS) ---------- */
const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;
const canNativeFs = (el) => !!(el.requestFullscreen || el.webkitRequestFullscreen);
function enterFs(el) {
  if (el.requestFullscreen) return el.requestFullscreen().catch(() => {});
  if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
}
function exitFs() {
  if (document.exitFullscreen) return document.exitFullscreen().catch(() => {});
  if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
}

/* =====================================================================
   SLIDE NAVIGATION
   ===================================================================== */
const slides = $$(".slide");
const SLIDE = { HERO: 0, LAYERS: 1, INTRO: 2, GUESS: 3, STUDIO: 4 };
let current = 0;
const onLeaveHandlers = {};
const onEnterHandlers = {};

function buildNav() {
  const dots = $("#navDots");
  slides.forEach((s, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "nav-dot";
    b.innerHTML = `<span class="num">${pad(i + 1)}</span><span class="lbl">${s.dataset.title || ""}</span>`;
    b.setAttribute("aria-label", s.dataset.title || `שקף ${i + 1}`);
    b.addEventListener("click", () => goTo(i));
    dots.appendChild(b);
  });
  $("#slideTotal").textContent = pad(slides.length);
  $("#prevBtn").addEventListener("click", () => goTo(current - 1));
  $("#nextBtn").addEventListener("click", () => goTo(current + 1));
}

function goTo(index) {
  index = clamp(index, 0, slides.length - 1);
  if (index === current && slides[index].classList.contains("is-active")) return;
  const prev = current;
  onLeaveHandlers[prev]?.();
  slides[prev].classList.remove("is-active");
  slides[prev].classList.toggle("is-leaving-back", index < prev);
  slides[index].classList.remove("is-leaving-back");
  slides[index].classList.add("is-active");
  current = index;
  onEnterHandlers[index]?.();
  updateNav();
  if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
  try { history.replaceState(null, "", `#${index + 1}`); } catch (_) {}
}

function updateNav() {
  $$(".nav-dot").forEach((d, i) => d.classList.toggle("is-active", i === current));
  $("#slideNum").textContent = pad(current + 1);
  $("#navProgress").style.width = `${(current / (slides.length - 1)) * 100}%`;
  $("#prevBtn").disabled = current === 0;
  $("#nextBtn").disabled = current === slides.length - 1;
  document.body.classList.toggle("on-hero", current === SLIDE.HERO);
}

/* =====================================================================
   GLOBAL KEYBOARD
   ===================================================================== */
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  // While typing: only Esc (leave the text box) is handled.
  if (isTyping(e.target)) {
    if (e.key === "Escape") { e.target.blur(); e.preventDefault(); }
    return;
  }

  const key = e.key;
  const nextKey = SETTINGS.rtlArrows ? "ArrowLeft" : "ArrowRight";
  const prevKey = SETTINGS.rtlArrows ? "ArrowRight" : "ArrowLeft";
  const handled = () => e.preventDefault();

  // PageUp / PageDown always switch slides (also on slide 5)
  if (key === "PageDown") { handled(); return goTo(current + 1); }
  if (key === "PageUp")   { handled(); return goTo(current - 1); }

  switch (current) {
    case SLIDE.STUDIO:
      // Arrows & Space belong to the video here (normal + fullscreen)
      if (key === " " || key === "Spacebar") { handled(); return Studio.toggle(); }
      if (key === "ArrowLeft")  { handled(); return Studio.step(-SETTINGS.stepSeconds); }
      if (key === "ArrowRight") { handled(); return Studio.step(+SETTINGS.stepSeconds); }
      if (key === "f" || key === "F" || key === "כ") { handled(); return Studio.toggleFs(); }
      if (key === "Escape" && Studio.isFs()) { handled(); return Studio.toggleFs(false); }
      if (key === "Home") { handled(); return Studio.seek(0); }
      return;

    case SLIDE.HERO:
      if (key === "Enter" || key === " ") { handled(); return goTo(SLIDE.LAYERS); }
      break;

    case SLIDE.LAYERS:
      if (key === "Enter" || key === " ") { handled(); return Layers.revealNext(); }
      break;

    case SLIDE.INTRO:
      if (key === " ") { handled(); return introPlayer.toggle(); }
      if (key === "f" || key === "F") { handled(); return introPlayer.toggleFs(); }
      break;

    case SLIDE.GUESS:
      if (key === " ") { handled(); return guessPlayer.toggle(); }
      break;
  }

  if (key === nextKey) { handled(); goTo(current + 1); }
  else if (key === prevKey) { handled(); goTo(current - 1); }
  else if (key === "Home") { handled(); goTo(0); }
  else if (key === "End") { handled(); goTo(slides.length - 1); }
});

/* =====================================================================
   SLIDE 1 — HERO: ambient particles + soundwave reacting to the mouse
   ===================================================================== */
const Hero = (() => {
  const canvas = $("#heroCanvas");
  const ctx = canvas.getContext("2d");
  const beam = $(".hero-beam");
  let w = 0, h = 0, dpr = 1, raf = 0, running = false, t = 0;
  const mouse = { x: 0.5, y: 0.45, tx: 0.5, ty: 0.45, energy: 0 };
  let particles = [];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(clamp((w * h) / 9000, 60, 220));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 1.6 + 0.3,
      vx: (Math.random() - 0.5) * 0.15, vy: -Math.random() * 0.25 - 0.05,
      a: Math.random() * 0.6 + 0.15, tw: Math.random() * Math.PI * 2,
      depth: Math.random() * 0.8 + 0.2,
    }));
  }

  function frame() {
    if (!running) return;
    t += 0.016;
    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;
    mouse.energy *= 0.96;
    ctx.clearRect(0, 0, w, h);

    // Dust in the projector light
    const px = (mouse.x - 0.5) * 40, py = (mouse.y - 0.5) * 30;
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy; p.tw += 0.03;
      if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
      if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
      const x = p.x + px * p.depth, y = p.y + py * p.depth;
      const dx = x - mouse.x * w, dy = y - mouse.y * h;
      const near = Math.max(0, 1 - Math.hypot(dx, dy) / 320);
      const alpha = p.a * (0.55 + 0.45 * Math.sin(p.tw)) + near * 0.5;
      ctx.beginPath();
      ctx.fillStyle = `rgba(245, 205, 130, ${alpha})`;
      ctx.arc(x, y, p.r * (1 + near * 1.2), 0, Math.PI * 2);
      ctx.fill();
    }

    // Soundwave lines along the lower third
    const baseY = h * 0.8;
    const amp = 10 + mouse.energy * 50 + (1 - Math.abs(mouse.y - 0.8)) * 14;
    for (let layer = 0; layer < 3; layer++) {
      ctx.beginPath();
      const phase = t * (1.2 + layer * 0.4);
      for (let x = 0; x <= w; x += 4) {
        const nx = x / w;
        const focus = Math.exp(-Math.pow((nx - mouse.x) * 3.2, 2));
        const env = Math.sin(nx * Math.PI);
        const y = baseY +
          Math.sin(nx * 18 + phase + layer) * amp * focus * env +
          Math.sin(nx * 42 - phase * 1.7) * amp * 0.25 * env * (0.4 + focus);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      const g = ctx.createLinearGradient(0, 0, w, 0);
      const a = [0.55, 0.25, 0.12][layer];
      g.addColorStop(0, "rgba(229,169,60,0)");
      g.addColorStop(clamp(mouse.x - 0.25, 0.01, 0.98), `rgba(229,169,60,${a * 0.5})`);
      g.addColorStop(clamp(mouse.x, 0.02, 0.98), `rgba(245,200,120,${a})`);
      g.addColorStop(clamp(mouse.x + 0.25, 0.03, 0.99), `rgba(229,169,60,${a * 0.5})`);
      g.addColorStop(1, "rgba(229,169,60,0)");
      ctx.strokeStyle = g;
      ctx.lineWidth = layer === 0 ? 1.6 : 1;
      ctx.stroke();
    }
    raf = requestAnimationFrame(frame);
  }

  window.addEventListener("pointermove", (e) => {
    if (current !== SLIDE.HERO) return;
    const nx = e.clientX / window.innerWidth, ny = e.clientY / window.innerHeight;
    mouse.energy = clamp(mouse.energy + Math.hypot(nx - mouse.tx, ny - mouse.ty) * 4, 0, 1);
    mouse.tx = nx; mouse.ty = ny;
    beam.style.setProperty("--mx", `${nx * 100}%`);
    beam.style.setProperty("--my", `${ny * 100}%`);
  });
  window.addEventListener("resize", () => running && resize());

  const start = () => { if (running) return; running = true; resize(); raf = requestAnimationFrame(frame); };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  $("#startBtn").addEventListener("click", () => goTo(SLIDE.LAYERS));
  return { start, stop };
})();
onEnterHandlers[SLIDE.HERO] = Hero.start;
onLeaveHandlers[SLIDE.HERO] = Hero.stop;

/* =====================================================================
   SLIDE 2 — Reveal soundtrack layers one by one
   ===================================================================== */
const Layers = (() => {
  const channels = $$(".channel");
  const btn = $("#revealBtn"), label = $("#revealLabel"), reset = $("#resetLayersBtn");
  let revealed = 0;

  // Build the waveform bars (deterministic per card)
  $$(".wave").forEach((wave) => {
    let seed = Number(wave.dataset.seed) * 9301;
    const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    const n = 38;
    for (let i = 0; i < n; i++) {
      const bar = document.createElement("i");
      const env = Math.sin((i / (n - 1)) * Math.PI);
      bar.style.height = `${Math.round((0.2 + rand() * 0.8) * env * 100 + 6)}%`;
      bar.style.animationDelay = `${-rand() * 1.1}s`;
      bar.style.animationDuration = `${0.6 + rand() * 0.8}s`;
      wave.appendChild(bar);
    }
  });

  function update() {
    channels.forEach((c, i) => c.classList.toggle("is-revealed", i < revealed));
    btn.disabled = revealed >= channels.length;
    label.textContent = revealed >= channels.length ? "כל השכבות נחשפו" : "חשוף את השכבה הבאה";
    reset.hidden = revealed === 0;
  }
  function revealNext() {
    if (revealed >= channels.length) return goTo(SLIDE.INTRO); // next press continues
    const c = channels[revealed++];
    c.classList.remove("is-flash"); void c.offsetWidth; c.classList.add("is-flash");
    update();
  }
  btn.addEventListener("click", revealNext);
  channels.forEach((c, i) => c.addEventListener("click", () => { if (i === revealed) revealNext(); }));
  reset.addEventListener("click", () => { revealed = 0; update(); });
  update();
  return { revealNext };
})();

/* =====================================================================
   Generic cinematic player (slides 3 & 4)
   ===================================================================== */
function createPlayer(root, video) {
  const bar = $('[data-el="bar"]', root), fill = $('[data-el="fill"]', root),
        thumb = $('[data-el="thumb"]', root), buf = $('[data-el="buf"]', root),
        cur = $('[data-el="cur"]', root), dur = $('[data-el="dur"]', root),
        vol = $('[data-el="vol"]', root), big = $(".theater-bigplay", root),
        missing = $(".media-missing", root);

  const toggle = () => {
    if (root.classList.contains("has-missing")) return;
    video.paused || video.ended ? video.play().catch(() => {}) : video.pause();
  };
  const toggleFs = () => (fsElement() ? exitFs() : enterFs(root));

  function render() {
    const d = video.duration || 0, p = d ? video.currentTime / d : 0;
    fill.style.width = `${p * 100}%`;
    thumb.style.left = `${p * 100}%`;
    cur.textContent = fmtShort(video.currentTime);
    dur.textContent = fmtShort(d);
    if (video.buffered.length && d) buf.style.width = `${(video.buffered.end(video.buffered.length - 1) / d) * 100}%`;
  }
  const markMissing = () => { root.classList.add("has-missing"); if (missing) missing.hidden = false; };

  video.addEventListener("timeupdate", render);
  video.addEventListener("loadedmetadata", render);
  video.addEventListener("progress", render);
  video.addEventListener("play", () => root.classList.add("is-playing"));
  video.addEventListener("pause", () => root.classList.remove("is-playing"));
  video.addEventListener("ended", () => root.classList.remove("is-playing"));
  video.addEventListener("volumechange", () => root.classList.toggle("is-muted", video.muted || video.volume === 0));
  video.addEventListener("error", markMissing);
  $$("source", video).forEach((s) => s.addEventListener("error", markMissing));
  video.addEventListener("click", toggle);
  big?.addEventListener("click", toggle);

  $$("[data-act]", root).forEach((b) => b.addEventListener("click", () => {
    const act = b.dataset.act;
    if (act === "play") toggle();
    if (act === "mute") video.muted = !video.muted;
    if (act === "fs") toggleFs();
  }));
  vol?.addEventListener("input", () => { video.volume = Number(vol.value); video.muted = video.volume === 0; });

  // Seek by dragging the progress bar (LTR)
  const seekAt = (clientX) => {
    const r = bar.getBoundingClientRect();
    if (video.duration) video.currentTime = clamp((clientX - r.left) / r.width, 0, 1) * video.duration;
    render();
  };
  bar.addEventListener("pointerdown", (e) => {
    bar.setPointerCapture(e.pointerId); bar.classList.add("is-drag"); seekAt(e.clientX);
  });
  bar.addEventListener("pointermove", (e) => bar.classList.contains("is-drag") && seekAt(e.clientX));
  const endDrag = () => bar.classList.remove("is-drag");
  bar.addEventListener("pointerup", endDrag);
  bar.addEventListener("pointercancel", endDrag);

  setTimeout(() => { if (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) markMissing(); }, 1500);
  render();
  return { toggle, toggleFs, pause: () => video.pause() };
}

const introPlayer = createPlayer($("#introPlayer"), $("#introVideo"));
const guessPlayer = createPlayer($("#guessPlayer"), $("#guessVideo"));
onLeaveHandlers[SLIDE.INTRO] = introPlayer.pause;
onLeaveHandlers[SLIDE.GUESS] = guessPlayer.pause;

/* =====================================================================
   SLIDE 4 — Flip cards
   ===================================================================== */
(() => {
  const grid = $("#cardGrid");
  const imgIcon = `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/></svg>`;
  const esc = (s = "") => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  GUESS_CARDS.forEach((card, i) => {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "flip-card";
    el.setAttribute("aria-label", `כרטיס ${i + 1}`);
    el.innerHTML = `
      <div class="flip-inner">
        <div class="flip-face flip-front">
          <span class="flip-num en">SFX ${pad(i + 1)}</span>
          <div class="flip-img"><img src="${esc(card.frontImage)}" alt="" loading="lazy" /><div class="img-fallback">${imgIcon}</div></div>
          <div class="flip-q">?</div>
          <div class="flip-caption">${esc(card.question || "ממה עשוי הצליל?")}</div>
        </div>
        <div class="flip-face flip-back">
          <div class="flip-img"><img src="${esc(card.backImage)}" alt="${esc(card.answer)}" loading="lazy" /><div class="img-fallback">${imgIcon}</div></div>
          <div class="flip-caption">
            <div class="flip-answer">${esc(card.answer)}</div>
            ${card.sound ? `<div class="flip-sound">הצליל: ${esc(card.sound)}</div>` : ""}
          </div>
        </div>
      </div>`;
    $$("img", el).forEach((img) => img.addEventListener("error", () => img.parentElement.classList.add("no-img")));
    el.addEventListener("click", () => el.classList.toggle("is-flipped"));
    grid.appendChild(el);
  });

  const flipAll = $("#flipAllBtn");
  flipAll.addEventListener("click", () => {
    const cards = $$(".flip-card", grid);
    const anyHidden = cards.some((c) => !c.classList.contains("is-flipped"));
    cards.forEach((c, i) => setTimeout(() => c.classList.toggle("is-flipped", anyHidden), i * 90));
    flipAll.textContent = anyHidden ? "החזר את כל הכרטיסים" : "הפוך את כל הכרטיסים";
  });
})();

/* =====================================================================
   SLIDE 5 — Live Foley & scoring studio
   ===================================================================== */
const Studio = (() => {
  const video = $("#studioVideo");
  const monitor = $("#monitor");
  const screen = $(".monitor-screen", monitor);
  const stateIcon = $("#monitorState");
  const timeline = $("#timeline"), ruler = $("#tlRuler"), playhead = $("#playhead"), progress = $("#tlProgress");
  const tcCur = $("#tcCurrent"), tcDur = $("#tcDuration"), monitorTc = $("#monitorTc");
  const audioLane = $("#tlAudio"), audioLabel = $("#tlAudioLabel"), monitorMusic = $("#monitorMusic");
  const studioRoot = $(".studio");
  const PAD = 16; // timeline side padding (matches CSS)

  video.muted = true; // the scene is silent on purpose
  let selected = -1;
  let dragging = false, wasPlaying = false, raf = 0, pseudoFs = false;

  /* ----- Music ----- */
  const audios = MUSIC_TRACKS.map((t) => {
    const a = new Audio();
    a.preload = "auto";
    a.loop = true;
    a.src = t.src;
    a.volume = SETTINGS.musicVolume;
    return a;
  });
  const list = $("#trackList");
  const check = `<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg>`;
  const rows = [];
  const makeRow = (idx, title, sub) => {
    const r = document.createElement("button");
    r.type = "button";
    r.className = "track-row" + (idx < 0 ? " is-none" : "");
    r.setAttribute("role", "radio");
    r.innerHTML = `
      <span class="track-box">${check}</span>
      <span class="track-text"><span class="track-title">${title}</span>${sub ? `<span class="track-sub en">${sub}</span>` : ""}</span>
      <span class="track-eq"><i></i><i></i><i></i><i></i></span>`;
    r.addEventListener("click", () => selectTrack(idx === selected && idx >= 0 ? -1 : idx));
    list.appendChild(r);
    rows.push({ el: r, idx });
    return r;
  };
  MUSIC_TRACKS.forEach((t, i) => {
    const r = makeRow(i, t.title, t.subtitle);
    audios[i].addEventListener("error", () => {
      if (!$(".track-missing", r)) $(".track-title", r).insertAdjacentHTML("beforeend", `<span class="track-missing">(קובץ חסר)</span>`);
    });
  });
  makeRow(-1, NO_MUSIC_LABEL, "");

  const activeAudio = () => (selected >= 0 ? audios[selected] : null);

  function syncAudio(force = false) {
    const a = activeAudio();
    if (!a || !SETTINGS.musicFollowsVideoTime) return;
    const target = a.duration && isFinite(a.duration) ? video.currentTime % a.duration : video.currentTime;
    if (force || Math.abs(a.currentTime - target) > 0.25) {
      try { a.currentTime = target; } catch (_) {}
    }
  }
  function playAudio() { const a = activeAudio(); if (a) { syncAudio(true); a.play().catch(() => {}); } }
  function pauseAudio() { audios.forEach((a) => a.pause()); }

  function selectTrack(idx) {
    pauseAudio();
    selected = idx;
    rows.forEach(({ el, idx: i }) => {
      const on = i === selected;
      el.classList.toggle("is-on", on);
      el.setAttribute("aria-checked", on ? "true" : "false");
    });
    const name = idx >= 0 ? MUSIC_TRACKS[idx].title : "";
    audioLane.classList.toggle("on", idx >= 0);
    audioLabel.textContent = idx >= 0 ? `♪ ${name}` : "— no music —";
    monitorMusic.textContent = idx >= 0 ? `♪ ${name}` : "NO MUSIC";
    monitorMusic.classList.toggle("on", idx >= 0);
    if (!video.paused) playAudio();
    updateLive();
  }
  function updateLive() {
    rows.forEach(({ el }) => el.classList.toggle("is-live", !video.paused));
  }
  $("#musicVolume").value = SETTINGS.musicVolume;
  $("#musicVolume").addEventListener("input", (e) => audios.forEach((a) => (a.volume = Number(e.target.value))));

  /* ----- Transport ----- */
  function flashState(paused) {
    stateIcon.classList.toggle("show-pause", paused);
    stateIcon.classList.remove("pulse"); void stateIcon.offsetWidth; stateIcon.classList.add("pulse");
  }
  function toggle() {
    if (monitor.classList.contains("has-missing")) return;
    if (video.paused || video.ended) { video.play().catch(() => {}); flashState(false); }
    else { video.pause(); flashState(true); }
  }
  function seek(t) {
    const d = video.duration || 0;
    video.currentTime = d ? clamp(t, 0, d) : Math.max(0, t);
    render();
    syncAudio(true);
  }
  const step = (delta) => seek(video.currentTime + delta);

  video.addEventListener("play", () => { studioRoot.classList.add("is-playing"); monitor.classList.add("is-playing"); playAudio(); updateLive(); loop(); });
  video.addEventListener("pause", () => { studioRoot.classList.remove("is-playing"); monitor.classList.remove("is-playing"); if (!dragging) pauseAudio(); updateLive(); });
  video.addEventListener("ended", () => { pauseAudio(); updateLive(); });
  video.addEventListener("seeked", () => { if (!video.paused) syncAudio(); });
  video.addEventListener("loadedmetadata", () => { buildRuler(); render(); });
  video.addEventListener("timeupdate", () => { if (video.paused) render(); });
  video.addEventListener("click", toggle);
  const markMissing = () => { monitor.classList.add("has-missing"); $(".media-missing", monitor).hidden = false; };
  video.addEventListener("error", markMissing);
  $$("source", video).forEach((s) => s.addEventListener("error", markMissing));
  setTimeout(() => { if (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) markMissing(); }, 1500);

  $("#studioPlayBtn").addEventListener("click", toggle);
  $("#stepBackBtn").addEventListener("click", () => step(-SETTINGS.stepSeconds));
  $("#stepFwdBtn").addEventListener("click", () => step(+SETTINGS.stepSeconds));

  function loop() {
    cancelAnimationFrame(raf);
    const tick = () => {
      render();
      if (!video.paused && !video.ended) { syncAudio(); raf = requestAnimationFrame(tick); }
    };
    raf = requestAnimationFrame(tick);
  }

  /* ----- Timeline ----- */
  const duration = () => (isFinite(video.duration) && video.duration > 0 ? video.duration : 60);
  const trackWidth = () => timeline.clientWidth - PAD * 2;

  function buildRuler() {
    ruler.innerHTML = "";
    const d = duration(), w = trackWidth();
    if (w <= 0) return;
    const pxPerSec = w / d;
    // choose a label interval that leaves ~70px between labels
    const steps = [1, 2, 5, 10, 15, 30, 60, 120, 300];
    const major = steps.find((s) => s * pxPerSec >= 70) || 600;
    // minor ticks: frames-ish when zoomed in, else subdivisions of seconds
    const minor = pxPerSec >= 60 ? 1 / 5 : pxPerSec >= 18 ? 1 / 2 : pxPerSec >= 8 ? 1 : major / 5;
    const frag = document.createDocumentFragment();
    const count = Math.floor(d / minor + 1e-6);
    for (let i = 0; i <= count; i++) {
      const t = i * minor;
      const tick = document.createElement("div");
      const isMajor = Math.abs(t / major - Math.round(t / major)) < 1e-6;
      const isSecond = Math.abs(t - Math.round(t)) < 1e-6;
      tick.className = "tl-tick" + (isMajor ? " major" : isSecond ? " mid" : "");
      tick.style.left = `${(t / d) * 100}%`;
      frag.appendChild(tick);
      if (isMajor) {
        const lb = document.createElement("span");
        lb.className = "tl-label";
        lb.textContent = fmtShort(t);
        lb.style.left = `${(t / d) * 100}%`;
        frag.appendChild(lb);
      }
    }
    ruler.appendChild(frag);
    timeline.setAttribute("aria-valuemax", String(Math.round(d)));
  }
  ruler.style.margin = "0"; // ruler is inside padding already

  function render() {
    const d = duration(), t = video.currentTime || 0;
    const x = PAD + (t / d) * trackWidth();
    playhead.style.left = `${x}px`;
    progress.style.width = `${x - PAD}px`;
    const tc = fmtTc(t);
    tcCur.textContent = tc; monitorTc.textContent = tc;
    tcDur.textContent = fmtTc(isFinite(video.duration) ? video.duration : 0);
    timeline.setAttribute("aria-valuenow", String(Math.round(t)));
    timeline.setAttribute("aria-valuetext", tc);
  }

  const timeAt = (clientX) => {
    const r = timeline.getBoundingClientRect();
    return clamp((clientX - r.left - PAD) / trackWidth(), 0, 1) * duration();
  };
  timeline.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    timeline.setPointerCapture(e.pointerId);
    dragging = true; wasPlaying = !video.paused;
    timeline.classList.add("is-drag");
    if (wasPlaying) video.pause();
    pauseAudio();
    seek(timeAt(e.clientX));
  });
  timeline.addEventListener("pointermove", (e) => { if (dragging) seek(timeAt(e.clientX)); });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    timeline.classList.remove("is-drag");
    if (wasPlaying) video.play().catch(() => {});
  };
  timeline.addEventListener("pointerup", endDrag);
  timeline.addEventListener("pointercancel", endDrag);
  timeline.addEventListener("wheel", (e) => {
    e.preventDefault();
    step((e.deltaY || e.deltaX) > 0 ? 1 / SETTINGS.timecodeFps * 5 : -1 / SETTINGS.timecodeFps * 5);
  }, { passive: false });
  window.addEventListener("resize", () => { buildRuler(); render(); });

  /* ----- Subtitles ----- */
  const input = $("#subsInput"), out = $("#subtitleOut");
  input.addEventListener("input", () => (out.textContent = input.value));
  $("#subsClear").addEventListener("click", () => { input.value = ""; out.textContent = ""; input.focus(); });

  /* ----- Fullscreen (monitor + subtitles) ----- */
  let hintTimer = 0;
  const isFs = () => fsElement() === monitor || pseudoFs;
  function applyFsClass() {
    const on = isFs();
    monitor.classList.toggle("is-fs", on);
    document.body.classList.toggle("studio-fs", on);
    $("#fsBtn").setAttribute("aria-label", on ? "יציאה ממסך מלא" : "מסך מלא");
    clearTimeout(hintTimer);
    monitor.classList.remove("hint-faded");
    if (on) hintTimer = setTimeout(() => monitor.classList.add("hint-faded"), 3500);
  }
  function toggleFs(force) {
    const want = typeof force === "boolean" ? force : !isFs();
    if (canNativeFs(monitor)) {
      if (want && !fsElement()) enterFs(monitor);
      else if (!want && fsElement()) exitFs();
    } else {
      pseudoFs = want; applyFsClass();
    }
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
  }
  document.addEventListener("fullscreenchange", applyFsClass);
  document.addEventListener("webkitfullscreenchange", applyFsClass);
  $("#fsBtn").addEventListener("click", () => toggleFs());
  screen.addEventListener("dblclick", () => toggleFs());

  selectTrack(-1);
  buildRuler();
  render();

  return {
    toggle, step, seek, toggleFs, isFs,
    enter: () => { requestAnimationFrame(() => { buildRuler(); render(); }); },
    leave: () => { video.pause(); pauseAudio(); if (isFs()) toggleFs(false); },
  };
})();
onEnterHandlers[SLIDE.STUDIO] = Studio.enter;
onLeaveHandlers[SLIDE.STUDIO] = Studio.leave;

/* =====================================================================
   BOOT
   ===================================================================== */
buildNav();
(() => {
  const fromHash = parseInt(location.hash.slice(1), 10);
  const start = fromHash >= 1 && fromHash <= slides.length ? fromHash - 1 : 0;
  slides.forEach((s) => s.classList.remove("is-active"));
  current = start;
  slides[start].classList.add("is-active");
  onEnterHandlers[start]?.();
  updateNav();
})();
