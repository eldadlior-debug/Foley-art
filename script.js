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

/* =====================================================================
   CONFIG — Slide 5: timed subtitles
   The cues are stored in assets/subtitles.json (shared with everyone).
   Edit them in the "כתוביות מתוזמנות" tab, press "ייצוא JSON", and
   upload the downloaded file to assets/ in GitHub (replace the old one).
   ===================================================================== */
const SUBTITLES_FILE = "assets/subtitles.json";

/* Label of the "no music" row (keeps the scene fully silent) */
const NO_MUSIC_LABEL = "ללא מוזיקה (שקט מוחלט)";

/* =====================================================================
   CONFIG — Slide 5: "Guess the sound" flip cards
   - title:     shown on the front of the card, above the clip
   - video:     the short clip on the front (press ▶ to play it WITH sound;
                click anywhere else on the card to flip it)
   - answer:    the real object/prop (back of the card, big text)
   - sound:     small line under the answer — can be ""
   - answerVideo: the answer clip on the back (how the sound is really made;
                press ▶ to play it with sound). Leave "" to show backImage instead
   - backImage: photo of the prop (back of the card, used when there is no
                answerVideo); a missing file shows a neat placeholder icon
   ===================================================================== */
const GUESS_CARDS = [
  {
    title: "בשר יוצא מהקופסא",
    video: "assets/cards/clip1.mp4",
    answer: "",
    sound: "",
    answerVideo: "assets/cards/answer1.mp4",
    backImage: "assets/cards/clip1-prop.jpg",
  },
  {
    title: "סידור הקציצות",
    video: "assets/cards/clip2.mp4",
    answer: "",
    sound: "",
    answerVideo: "assets/cards/answer2.mp4",
    backImage: "assets/cards/clip2-prop.jpg",
  },
  {
    title: "משחקים עם המרית",
    video: "assets/cards/clip3.mp4",
    answer: "",
    sound: "",
    answerVideo: "assets/cards/answer3.mp4",
    backImage: "assets/cards/clip3-prop.jpg",
  },
  {
    title: "סידור הלחמניות",
    video: "assets/cards/clip4.mp4",
    answer: "",
    sound: "",
    answerVideo: "assets/cards/answer4.mp4",
    backImage: "assets/cards/clip4-prop.jpg",
  },
  {
    title: "מגש ההמבורגרים",
    video: "assets/cards/clip5.mp4",
    answer: "",
    sound: "",
    answerVideo: "assets/cards/answer5.mp4",
    backImage: "",
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

  /* false = subtitles start hidden (reveal them with the eye or S). */
  subtitlesVisibleAtStart: false,

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
const SLIDE = { HERO: 0, LAYERS: 1, INTRO: 2, SCENE: 3, GUESS: 4, PERFORM: 5, STUDIO: 6 };
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
  $("#sidePrev").addEventListener("click", (e) => { e.currentTarget.blur(); goTo(current - 1); });
  $("#sideNext").addEventListener("click", (e) => { e.currentTarget.blur(); goTo(current + 1); });

  // Touch (iPad): swipe to change slides. RTL like the arrow keys:
  // swipe right = next slide, swipe left = previous. Swipes that start on
  // a player bar, the studio timeline, a slider or a text box are left alone.
  let touch = null;
  const NO_SWIPE = ".player-controls, .timeline-wrap, #subsPanel, input, textarea, select, .pc-progress, .app-view";
  document.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1 || e.target.closest(NO_SWIPE)) { touch = null; return; }
    touch = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
  }, { passive: true });
  document.addEventListener("touchend", (e) => {
    if (!touch) return;
    const dx = e.changedTouches[0].clientX - touch.x, dy = e.changedTouches[0].clientY - touch.y;
    const quick = Date.now() - touch.t < 800;
    touch = null;
    if (!quick || Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    const forward = SETTINGS.rtlArrows ? dx > 0 : dx < 0;
    goTo(current + (forward ? 1 : -1));
  }, { passive: true });
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
  $("#sidePrev").hidden = current === 0;
  $("#sideNext").hidden = current === slides.length - 1;
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
      if (key === "s" || key === "S" || key === "ד") { handled(); return Studio.toggleSubs(); }
      if (key === "i" || key === "I" || key === "ן") { handled(); return Studio.markIn(); }
      if (key === "o" || key === "O" || key === "ם") { handled(); return Studio.markOut(); }
      if (key === "Delete" || key === "Backspace") { handled(); return Studio.deleteSelected(); }
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

    case SLIDE.SCENE:
      if (key === " ") { handled(); return scenePlayer.toggle(); }
      if (key === "f" || key === "F") { handled(); return scenePlayer.toggleFs(); }
      break;

    case SLIDE.PERFORM:
      if (key === " ") { handled(); return performPlayer.toggle(); }
      if (key === "f" || key === "F") { handled(); return performPlayer.toggleFs(); }
      break;

    case SLIDE.GUESS:
      if (Book.isOpen()) {
        if (key === " ") { handled(); return Book.playBoth(); }
        if (key === "Escape") { handled(); return Book.close(); }
        if (key === nextKey) { handled(); return Book.step(1); }
        if (key === prevKey) { handled(); return Book.step(-1); }
      }
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
  const heroSlide = $(".slide-hero");
  let w = 0, h = 0, dpr = 1, raf = 0, running = false, t = 0, last = 0;
  // focus = where the light + soundwave "listen". It drives itself (autopilot)
  // and follows the real mouse for a few seconds whenever the mouse moves.
  const focus = { x: 0.5, y: 0.55 };
  const light = { x: 0.5, y: 0.45 };   // the warm light: mouse only, like the original
  const mouse = { x: 0.5, y: 0.5, lastMove: -99, energy: 0 };
  let particles = [], sparks = [];
  let level = 0, hit = 0, nextHit = 1.2;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(clamp((w * h) / 9000, 60, 220));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 1.7 + 0.3,
      vx: (Math.random() - 0.5) * 0.15, vy: -Math.random() * 0.25 - 0.05,
      a: Math.random() * 0.6 + 0.15, tw: Math.random() * Math.PI * 2,
      depth: Math.random() * 0.8 + 0.2,
    }));
  }

  // A fake "audio level" that behaves like someone speaking over music:
  // a breathing bed, syllable-like flutter, and occasional hits (like foley).
  function audioLevel(dt) {
    nextHit -= dt;
    if (nextHit <= 0) { hit = 0.7 + Math.random() * 0.3; nextHit = 1.1 + Math.random() * 2.2; }
    hit *= Math.pow(0.04, dt); // fast decay
    const bed = 0.32 + 0.18 * Math.sin(t * 0.9) + 0.1 * Math.sin(t * 0.37 + 1);
    const flutter = 0.22 * Math.abs(Math.sin(t * 6.3) * Math.sin(t * 2.7 + 0.5));
    const target = clamp(bed + flutter + hit * 0.75 + mouse.energy * 0.5, 0, 1.4);
    level += (target - level) * Math.min(1, dt * 9);
    return level;
  }

  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now; t += dt;
    const lv = audioLevel(dt);
    mouse.energy *= Math.pow(0.3, dt);

    // Autopilot path (slow figure-eight across the stage) blended with the mouse
    const ax = 0.5 + 0.34 * Math.sin(t * 0.23) + 0.06 * Math.sin(t * 0.71);
    const ay = 0.55 + 0.16 * Math.sin(t * 0.31 + 1.3);
    const follow = clamp(1 - (t - mouse.lastMove - 2.5) / 2, 0, 1); // 1 = mouse, fades back after 2.5s
    const tx = ax + (mouse.x - ax) * follow, ty = ay + (mouse.y - ay) * follow;
    focus.x += (tx - focus.x) * Math.min(1, dt * 2.2);
    focus.y += (ty - focus.y) * Math.min(1, dt * 2.2);
    light.x += (mouse.x - light.x) * Math.min(1, dt * 3.6);
    light.y += (mouse.y - light.y) * Math.min(1, dt * 3.6);
    heroSlide.style.setProperty("--lv", lv.toFixed(3));

    ctx.clearRect(0, 0, w, h);

    // Parallax follows the mouse only (as before)
    const camX = (light.x - 0.5) * 40, camY = (light.y - 0.5) * 30;

    // Dust in the projector light
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy; p.tw += 0.03;
      if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
      if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
      const x = p.x + camX * p.depth, y = p.y + camY * p.depth;
      const dx = x - light.x * w, dy = y - light.y * h;
      const near = Math.max(0, 1 - Math.hypot(dx, dy) / 320);
      const alpha = p.a * (0.55 + 0.45 * Math.sin(p.tw)) + near * 0.5;
      ctx.beginPath();
      ctx.fillStyle = `rgba(245, 205, 130, ${Math.min(1, alpha)})`;
      ctx.arc(x, y, p.r * (1 + near * 1.2), 0, Math.PI * 2);
      ctx.fill();
    }

    // Soundwave: several breathing layers, strongest where the focus is
    const baseY = h * 0.8;
    const amp = 12 + lv * 46;
    for (let layer = 0; layer < 5; layer++) {
      ctx.beginPath();
      const phase = t * (1.6 + layer * 0.55);
      const lf = 1 - layer * 0.14;
      for (let x = 0; x <= w; x += 3) {
        const nx = x / w;
        const f1 = Math.exp(-Math.pow((nx - focus.x) * 2.6, 2));
        const f2 = 0.55 * Math.exp(-Math.pow((nx - (1 - focus.x)) * 3.4, 2));
        const env = Math.sin(nx * Math.PI);
        const fo = f1 + f2;
        const y = baseY +
          Math.sin(nx * (16 + layer * 3) + phase + layer) * amp * lf * fo * env +
          Math.sin(nx * 47 - phase * 1.9) * amp * 0.22 * env * (0.35 + fo) +
          Math.sin(nx * 5 + t * 0.6 + layer) * 6 * env;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      const g = ctx.createLinearGradient(0, 0, w, 0);
      const al = [0.75, 0.42, 0.26, 0.16, 0.1][layer] * (0.7 + lv * 0.4);
      g.addColorStop(0, "rgba(229,169,60,0)");
      g.addColorStop(clamp(focus.x - 0.28, 0.01, 0.97), `rgba(229,169,60,${al * 0.45})`);
      g.addColorStop(clamp(focus.x, 0.02, 0.98), `rgba(255,214,140,${Math.min(1, al)})`);
      g.addColorStop(clamp(focus.x + 0.28, 0.03, 0.99), `rgba(229,169,60,${al * 0.45})`);
      g.addColorStop(1, "rgba(229,169,60,0)");
      ctx.strokeStyle = g;
      ctx.lineWidth = layer === 0 ? 2 : 1;
      if (layer === 0) { ctx.shadowColor = "rgba(245,190,90,.7)"; ctx.shadowBlur = 12 + lv * 14; }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Sparks fly up from the wave on every "hit"
    if (hit > 0.65 && Math.random() < 0.5) {
      for (let i = 0; i < 6; i++) sparks.push({
        x: focus.x * w + (Math.random() - 0.5) * 160, y: baseY,
        vx: (Math.random() - 0.5) * 1.4, vy: -Math.random() * 2.6 - 0.8, life: 1,
      });
    }
    sparks = sparks.filter((s) => (s.life -= dt * 0.7) > 0);
    for (const s of sparks) {
      s.x += s.vx; s.y += s.vy; s.vy += 0.015;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,220,150,${s.life * 0.9})`;
      ctx.arc(s.x, s.y, 1.4 * s.life + 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    raf = requestAnimationFrame(frame);
  }

  window.addEventListener("pointermove", (e) => {
    if (current !== SLIDE.HERO) return;
    const nx = e.clientX / window.innerWidth, ny = e.clientY / window.innerHeight;
    mouse.energy = clamp(mouse.energy + Math.hypot(nx - mouse.x, ny - mouse.y) * 4, 0, 1);
    mouse.x = nx; mouse.y = ny; mouse.lastMove = t;
    beam.style.setProperty("--mx", `${nx * 100}%`);
    beam.style.setProperty("--my", `${ny * 100}%`);
  });
  window.addEventListener("resize", () => running && resize());

  const start = () => { if (running) return; running = true; last = 0; resize(); raf = requestAnimationFrame(frame); };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  $("#startBtn").addEventListener("click", () => goTo(SLIDE.LAYERS));
  return { start, stop };
})();
onEnterHandlers[SLIDE.HERO] = Hero.start;
onLeaveHandlers[SLIDE.HERO] = Hero.stop;

/* =====================================================================
   SLIDE 2 — Face-down channels show the opening slide's soundwave
   (same layers, colours, glow, sparks and autopilot as the hero, scaled
   into each card; each card has its own rhythm)
   ===================================================================== */
const LockWaves = (() => {
  const items = $$(".channel").map((ch, i) => {
    const canvas = $(".lock-canvas", ch);
    return canvas && { ch, canvas, ctx: canvas.getContext("2d"), w: 0, h: 0, t: i * 7.3,
      focus: { x: 0.5 }, level: 0, hit: 0, nextHit: 0.6 + i * 0.7, sparks: [] };
  }).filter(Boolean);
  let raf = 0, running = false, last = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    items.forEach((it) => {
      it.w = it.canvas.clientWidth; it.h = it.canvas.clientHeight;
      it.canvas.width = it.w * dpr; it.canvas.height = it.h * dpr;
      it.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
  }
  function audioLevel(it, dt) {
    const t = it.t;
    it.nextHit -= dt;
    if (it.nextHit <= 0) { it.hit = 0.7 + Math.random() * 0.3; it.nextHit = 1.1 + Math.random() * 2.2; }
    it.hit *= Math.pow(0.04, dt);
    const bed = 0.32 + 0.18 * Math.sin(t * 0.9) + 0.1 * Math.sin(t * 0.37 + 1);
    const flutter = 0.22 * Math.abs(Math.sin(t * 6.3) * Math.sin(t * 2.7 + 0.5));
    const target = clamp(bed + flutter + it.hit * 0.75, 0, 1.4);
    it.level += (target - it.level) * Math.min(1, dt * 9);
    return it.level;
  }
  function draw(it, dt) {
    const { ctx, w, h } = it;
    ctx.clearRect(0, 0, w, h);
    if (it.ch.classList.contains("is-revealed") || !w) return;
    it.t += dt;
    const t = it.t, lv = audioLevel(it, dt), focus = it.focus;
    const ax = 0.5 + 0.34 * Math.sin(t * 0.23) + 0.06 * Math.sin(t * 0.71);
    focus.x += (ax - focus.x) * Math.min(1, dt * 2.2);
    const s = clamp(w / 420, 0.7, 1);             // scale the hero's amplitudes into the card
    const baseY = h * 0.5;
    const amp = (12 + lv * 46) * s;
    for (let layer = 0; layer < 5; layer++) {
      ctx.beginPath();
      const phase = t * (1.6 + layer * 0.55);
      const lf = 1 - layer * 0.14;
      for (let x = 0; x <= w; x += 2) {
        const nx = x / w;
        const f1 = Math.exp(-Math.pow((nx - focus.x) * 2.6, 2));
        const f2 = 0.55 * Math.exp(-Math.pow((nx - (1 - focus.x)) * 3.4, 2));
        const env = Math.sin(nx * Math.PI);
        const fo = f1 + f2;
        const y = baseY +
          Math.sin(nx * (16 + layer * 3) + phase + layer) * amp * lf * fo * env +
          Math.sin(nx * 47 - phase * 1.9) * amp * 0.22 * env * (0.35 + fo) +
          Math.sin(nx * 5 + t * 0.6 + layer) * 6 * s * env;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      const g = ctx.createLinearGradient(0, 0, w, 0);
      const al = [0.75, 0.42, 0.26, 0.16, 0.1][layer] * (0.7 + lv * 0.4);
      g.addColorStop(0, "rgba(229,169,60,0)");
      g.addColorStop(clamp(focus.x - 0.28, 0.01, 0.97), `rgba(229,169,60,${al * 0.45})`);
      g.addColorStop(clamp(focus.x, 0.02, 0.98), `rgba(255,214,140,${Math.min(1, al)})`);
      g.addColorStop(clamp(focus.x + 0.28, 0.03, 0.99), `rgba(229,169,60,${al * 0.45})`);
      g.addColorStop(1, "rgba(229,169,60,0)");
      ctx.strokeStyle = g;
      ctx.lineWidth = layer === 0 ? 2 : 1;
      if (layer === 0) { ctx.shadowColor = "rgba(245,190,90,.7)"; ctx.shadowBlur = 12 + lv * 14; }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    if (it.hit > 0.65 && Math.random() < 0.5) {
      for (let i = 0; i < 4; i++) it.sparks.push({
        x: focus.x * w + (Math.random() - 0.5) * 120 * s, y: baseY,
        vx: (Math.random() - 0.5) * 1.2, vy: -Math.random() * 2.2 - 0.6, life: 1,
      });
    }
    it.sparks = it.sparks.filter((p) => (p.life -= dt * 0.7) > 0);
    for (const p of it.sparks) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.015;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,220,150,${p.life * 0.9})`;
      ctx.arc(p.x, p.y, 1.4 * p.life + 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    items.forEach((it) => draw(it, dt));
    raf = requestAnimationFrame(frame);
  }
  window.addEventListener("resize", () => running && resize());
  const start = () => { if (running) return; running = true; last = 0; resize(); raf = requestAnimationFrame(frame); };
  const stop = () => { running = false; cancelAnimationFrame(raf); };
  return { start, stop };
})();

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
const scenePlayer = createPlayer($("#scenePlayer"), $("#sceneVideo"));
const guessPlayer = createPlayer($("#guessPlayer"), $("#guessVideo"));
onLeaveHandlers[SLIDE.SCENE] = scenePlayer.pause;
const performPlayer = createPlayer($("#performPlayer"), $("#performVideo"));
onLeaveHandlers[SLIDE.PERFORM] = performPlayer.pause;
onLeaveHandlers[SLIDE.INTRO] = introPlayer.pause;
onLeaveHandlers[SLIDE.GUESS] = guessPlayer.pause;

/* =====================================================================
   SLIDE 5 — Guess cards that open like an iPhone app
   Front: the cartoon clip (▶ plays it with sound). Tap the card: it grows
   to full screen and shows the scene (right) next to the real Foley
   performance (left). Close with ✕, Esc, or a swipe down. "Play both" runs them in sync (the scene muted, the
   Foley performance with sound).
   ===================================================================== */
const Book = (() => {  // the opened-card view
  const grid = $("#cardGrid");
  const overlay = $("#appView");
  const panel = $(".app-panel", overlay);
  document.body.appendChild(overlay); // above the nav bars, outside the slide's stacking context
  const esc = (s = "") => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const playIcon = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
  const pauseIcon = `<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>`;
  const allVideos = [];

  grid.classList.toggle("cards-4", GUESS_CARDS.length === 4);
  grid.classList.toggle("cards-5", GUESS_CARDS.length === 5);

  // One ▶ button per clip box; only one clip plays at a time (unless "both")
  const wireClip = (box) => {
    const video = $("video", box), btn = $(".clip-play", box);
    btn.innerHTML = playIcon + pauseIcon;
    allVideos.push(video);
    const toggle = () => {
      if (video.paused || video.ended) {
        allVideos.forEach((v) => v !== video && v.pause());
        guessPlayer.pause();
        video.muted = false;
        if (video.ended) video.currentTime = 0;
        video.play().catch(() => {});
      } else video.pause();
    };
    video.addEventListener("play", () => box.classList.add("is-playing"));
    video.addEventListener("pause", () => box.classList.remove("is-playing"));
    video.addEventListener("ended", () => box.classList.remove("is-playing"));
    btn.addEventListener("click", (e) => { e.stopPropagation(); toggle(); });
    video.addEventListener("click", (e) => { e.stopPropagation(); toggle(); });
    return video;
  };

  /* ----- The cards (front only) ----- */
  GUESS_CARDS.forEach((card, i) => {
    const el = document.createElement("div");
    el.className = "flip-card";
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", `כרטיס ${i + 1}: ${card.title || ""}`);
    el.innerHTML = `
      <div class="flip-inner">
        <div class="flip-face flip-front">
          <div class="flip-title">${esc(card.title || "")}</div>
          <div class="flip-img flip-video">
            <video src="${esc(card.video)}#t=0.1" preload="auto" playsinline></video>
            <button type="button" class="clip-play" aria-label="נגן את הקטע"></button>
            <span class="flip-num en">SFX ${pad(i + 1)}</span>
          </div>
          <div class="flip-caption">ממה עשוי הצליל? <span class="flip-hint">לחצו על הכרטיס כדי לפתוח</span></div>
        </div>
      </div>`;
    wireClip($(".flip-video", el));
    el.addEventListener("click", () => open(i, el));
    el.addEventListener("keydown", (e) => {
      if (e.target !== el) return;
      if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); open(i, el); }
    });
    grid.appendChild(el);
  });

  /* ----- The opened view: a carousel of all the pairs (like the iPhone
     app switcher). Swipe with two fingers / a finger, or use the arrows. ----- */
  const tpl = $(".app-panes", overlay);
  const track = document.createElement("div");
  track.className = "app-track";
  tpl.replaceWith(track);
  const numEl = $('[data-el="num"]', overlay);
  const pairs = GUESS_CARDS.map((card, i) => {
    const slide = document.createElement("div");
    slide.className = "car-slide";
    const panes = tpl.cloneNode(true);
    slide.appendChild(panes);
    track.appendChild(slide);
    $(".pane-scene video", panes).src = card.video + "#t=0.1";
    $(".pane-answer video", panes).src = (card.answerVideo || card.video) + "#t=0.1";
    $(".pane-scene video", panes).preload = "metadata";
    $(".pane-answer video", panes).preload = "metadata";
    $('[data-el="title"]', panes).textContent = card.title || "";
    $('[data-el="title2"]', panes).textContent = card.title || "";
    return {
      slide,
      paneScene: $(".pane-scene", panes), paneAnswer: $(".pane-answer", panes),
      scene: wireClip($(".pane-scene .page-video", panes)),
      answer: wireClip($(".pane-answer .page-video", panes)),
    };
  });
  const cardEls = () => $$(".flip-card", grid);
  let openIndex = -1, curIndex = 0, closeTimer = 0, fromCard = null;
  let sceneVideo = pairs[0].scene, answerVideo = pairs[0].answer;
  let paneScene = pairs[0].paneScene, paneAnswer = pairs[0].paneAnswer;

  // Neighbours shrink and dim the further they are from the centre
  const paint = () => {
    const mid = innerWidth / 2;
    let best = 0, bestD = 1e9;
    pairs.forEach((p, i) => {
      const r = p.slide.getBoundingClientRect();
      const d = Math.abs(r.left + r.width / 2 - mid);
      if (d < bestD) { bestD = d; best = i; }
      const k = clamp(d / (r.width || 1), 0, 1);
      p.slide.style.transform = `scale(${(1 - 0.16 * k).toFixed(4)})`;
      p.slide.style.opacity = (1 - 0.6 * k).toFixed(3);
    });
    return best;
  };
  const setCurrent = (i) => {
    if (i === curIndex && pairs[i].slide.classList.contains("is-current")) return;
    syncToken++;
    pairs.forEach((p, j) => { if (j !== i) { p.scene.pause(); p.answer.pause(); } p.slide.classList.toggle("is-current", j === i); });
    curIndex = i;
    ({ scene: sceneVideo, answer: answerVideo, paneScene, paneAnswer } = pairs[i]);
    numEl.textContent = `SFX ${pad(i + 1)}`;
    if (openIndex >= 0) openIndex = i;
  };
  /* The track moves with a transform we fully control (no browser scroll
     snapping), so every move is one smooth glide that lands exactly. */
  let pos = 0, dragX = 0, animUntil = 0, loopRaf = 0;
  const offsetFor = (i) => pairs[0].slide.offsetLeft - pairs[i].slide.offsetLeft;
  const apply = () => { track.style.transform = `translate3d(${offsetFor(pos) + dragX}px, 0, 0)`; };
  const loop = () => {
    setCurrent(paint());
    if (performance.now() < animUntil) loopRaf = requestAnimationFrame(loop);
  };
  const kick = (ms) => { animUntil = Math.max(animUntil, performance.now() + ms); cancelAnimationFrame(loopRaf); loopRaf = requestAnimationFrame(loop); };
  const centre = (i, behavior = "smooth") => {
    pos = clamp(i, 0, pairs.length - 1); dragX = 0;
    if (behavior === "smooth") {
      track.style.transition = "transform .6s cubic-bezier(.22, 1, .36, 1)";
      apply(); kick(700);
    } else {
      track.style.transition = "none"; apply(); void track.offsetWidth; track.style.transition = "";
      setCurrent(paint());
    }
  };
  const step = (dir) => { if (clamp(pos + dir, 0, pairs.length - 1) !== pos) centre(pos + dir); };
  const fwd = SETTINGS.rtlArrows ? -1 : 1;   // RTL: the next card sits to the left

  // Two-finger swipe on a trackpad (or a mouse wheel): one card per gesture
  let wheelAcc = 0, wheelLock = 0, wheelQuiet = 0;
  overlay.addEventListener("wheel", (e) => {
    if (openIndex < 0) return;
    e.preventDefault();
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY * fwd;
    clearTimeout(wheelQuiet);
    wheelQuiet = setTimeout(() => { wheelLock = 0; wheelAcc = 0; }, 180);  // gesture (incl. momentum) ended
    if (wheelLock) return;
    wheelAcc += d;
    if (Math.abs(wheelAcc) > 35) { wheelLock = 1; step(wheelAcc * fwd > 0 ? 1 : -1); wheelAcc = 0; }
  }, { passive: false });

  // Finger drag: the track follows the finger, then glides to the nearest card
  let tx0 = null, ty0 = 0, tt0 = 0, horiz = false;
  track.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    tx0 = e.touches[0].clientX; ty0 = e.touches[0].clientY; tt0 = performance.now(); horiz = false;
    track.style.transition = "none";
  }, { passive: true });
  track.addEventListener("touchmove", (e) => {
    if (tx0 === null) return;
    const dx = e.touches[0].clientX - tx0, dy = e.touches[0].clientY - ty0;
    if (!horiz && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) horiz = true;
    if (!horiz) return;
    const edge = (pos === 0 && dx * fwd > 0) || (pos === pairs.length - 1 && dx * fwd < 0);
    dragX = edge ? dx * 0.3 : dx;
    apply(); setCurrent(paint());
  }, { passive: true });
  track.addEventListener("touchend", (e) => {
    if (tx0 === null) return;
    const dx = e.changedTouches[0].clientX - tx0, v = dx / Math.max(1, performance.now() - tt0);
    tx0 = null;
    if (!horiz) { track.style.transition = ""; return; }
    const w = pairs[0].slide.offsetWidth;
    const far = Math.abs(dx) > w * 0.25 || Math.abs(v) > 0.4;
    centre(pos + (far ? (dx * fwd < 0 ? 1 : -1) : 0));   // RTL: finger moving right brings the next card
  }, { passive: true });

  // iPhone-style: the panel starts exactly on top of the card and springs to full screen


  /* iPhone app-switcher motion (~1 s):
     1) the tapped card zooms up to fill the screen with the scene,
     2) it shrinks back into a rounded card on the right while the Foley
        card slides in from the left, ending side by side. */
  const extras = $$(".app-head, .app-both", overlay);
  const EASE = "cubic-bezier(.22, .9, .25, 1)";
  const SPRING = (() => {
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40 * 0.82;                       // seconds
      const w = 2 * Math.PI / 0.62, z = 0.72;        // response .62s, damping .72
      const wd = w * Math.sqrt(1 - z * z);
      const v = 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t));
      pts.push(+v.toFixed(4));
    }
    pts[pts.length - 1] = 1;
    const lin = `linear(${pts.join(", ")})`;
    return CSS.supports("animation-timing-function", lin) ? lin : "cubic-bezier(.3, 1.25, .45, 1)";
  })();
  let anims = [];
  const stopAnims = () => { anims.forEach((an) => an.cancel()); anims = []; };
  const rectOf = (el) => el.getBoundingClientRect();
  const toRect = (from, to) =>
    `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${to.width / from.width}, ${to.height / from.height})`;
  const fullScreen = (r) => {
    const s = Math.min(innerWidth / r.width, innerHeight / r.height);
    return `translate(${(innerWidth - r.width * s) / 2 - r.left}px, ${(innerHeight - r.height * s) / 2 - r.top}px) scale(${s})`;
  };

  function open(i, fromEl) {
    allVideos.forEach((v) => v.pause());
    guessPlayer.pause();
    clearTimeout(closeTimer);
    stopAnims();
    fromCard = fromEl || null;
    overlay.hidden = false;
    overlay.classList.add("is-open");
    centre(i, "auto");
    setCurrent(i); openIndex = i;
    paint();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const S = rectOf(paneScene), A = rectOf(paneAnswer);
    // One continuous iOS-style spring: the card flies straight from its spot
    // in the grid to its place on the right, while the Foley card glides in
    // from the left at the same time. Slight overshoot, then settles.
    const start = fromCard ? toRect(S, rectOf(fromCard)) : "scale(.5)";
    const D = 820;
    anims.push(paneScene.animate([
      { transform: start, borderRadius: "16px" },
      { transform: "none", borderRadius: "18px" },
    ], { duration: D, easing: SPRING }));
    anims.push(paneAnswer.animate([
      { transform: `translateX(${-(A.right + 40)}px) scale(.9)`, opacity: .4 },
      { transform: "none", opacity: 1 },
    ], { duration: D, delay: 60, easing: SPRING, fill: "backwards" }));
    extras.forEach((el) => anims.push(el.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }],
      { duration: 380, delay: 380, easing: "ease-out", fill: "backwards" })));
    pairs.forEach((p, j) => { if (j !== i) anims.push(p.slide.animate([{ opacity: 0 }, { opacity: p.slide.style.opacity }], { duration: 420, delay: 360, easing: "ease-out", fill: "backwards" })); });
    anims.push(overlay.animate([
      { backgroundColor: "rgba(10,10,12,0)", backdropFilter: "blur(0px)" },
      { backgroundColor: "rgba(10,10,12,1)", backdropFilter: "blur(14px)" },
    ], { duration: 420, easing: "ease-out" }));
  }
  function close() {
    if (openIndex < 0) return;
    openIndex = -1;
    syncToken++;
    allVideos.forEach((v) => v.pause());
    stopAnims();
    fromCard = cardEls()[curIndex] || fromCard;
    const S = rectOf(paneScene), A = rectOf(paneAnswer);
    const D = 520;
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      anims.push(paneScene.animate([{ transform: "none" }, { transform: fromCard ? toRect(S, rectOf(fromCard)) : "scale(.5)", borderRadius: "16px" }], { duration: D, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" }));
      anims.push(paneAnswer.animate([{ transform: "none", opacity: 1 }, { transform: `translateX(${-(A.right + 60)}px)`, opacity: .6 }], { duration: D, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" }));
      extras.forEach((el) => anims.push(el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" })));
      pairs.forEach((p, j) => { if (j !== curIndex) anims.push(p.slide.animate([{ opacity: p.slide.style.opacity }, { opacity: 0 }], { duration: 220, fill: "forwards" })); });
      anims.push(overlay.animate([{ backgroundColor: "rgba(10,10,12,1)" }, { backgroundColor: "rgba(10,10,12,0)" }], { duration: D, fill: "forwards" }));
    }
    closeTimer = setTimeout(() => { stopAnims(); overlay.hidden = true; overlay.classList.remove("is-open"); }, D);
  }
  function playBoth() {
    allVideos.forEach((v) => v.pause());
    guessPlayer.pause();
    sceneVideo.muted = true;      // the scene stays silent…
    answerVideo.muted = false;    // …you hear the real Foley performance
    // Start both on the same frame: seek both, wait until both are ready, then
    // start together. While they play, the silent scene follows the Foley clock.
    const token = ++syncToken;
    const ready = (v) => new Promise((res) => {
      const ok = () => v.readyState >= 3 && !v.seeking;
      if (ok()) return res();
      const on = () => { if (ok()) { v.removeEventListener("seeked", on); v.removeEventListener("canplay", on); res(); } };
      v.addEventListener("seeked", on); v.addEventListener("canplay", on);
      setTimeout(res, 1500);
    });
    sceneVideo.currentTime = 0; answerVideo.currentTime = 0;
    Promise.all([ready(sceneVideo), ready(answerVideo)]).then(() => {
      if (token !== syncToken) return;
      const a = answerVideo.play(), b = sceneVideo.play();
      Promise.all([a, b].map((p) => p && p.catch(() => {}))).then(() => {
        if (token !== syncToken) return;
        sceneVideo.currentTime = answerVideo.currentTime;
        const follow = () => {
          if (token !== syncToken || answerVideo.paused || answerVideo.ended) return;
          const drift = sceneVideo.currentTime - answerVideo.currentTime;
          if (!sceneVideo.paused && Math.abs(drift) > 0.06) sceneVideo.currentTime = answerVideo.currentTime;
          requestAnimationFrame(follow);
        };
        requestAnimationFrame(follow);
      });
    });
  }
  let syncToken = 0;
  $(".app-both", overlay).addEventListener("click", (e) => { e.stopPropagation(); playBoth(); });
  $(".app-close", overlay).addEventListener("click", (e) => { e.stopPropagation(); close(); });
  overlay.addEventListener("click", (e) => {
    const t = e.target;
    if (t.closest(".app-close, .app-both, .app-title")) return;
    const slide = t.closest(".car-slide");
    if (slide && t.closest(".app-pane")) {
      const i = pairs.findIndex((p) => p.slide === slide);
      if (i !== curIndex) { e.stopPropagation(); e.preventDefault(); centre(i); }
      return;
    }
    close();   // anywhere outside the open screens
  }, true);
  // Swipe down on the opened card closes it (like going home on an iPhone)
  let sy = null;
  panel.addEventListener("touchstart", (e) => { sy = e.target.closest(".page-video") ? null : e.touches[0].clientY; }, { passive: true });
  panel.addEventListener("touchend", (e) => { if (sy !== null && e.changedTouches[0].clientY - sy > 90) close(); sy = null; }, { passive: true });

  onLeaveHandlers[SLIDE.GUESS] = () => { guessPlayer.pause(); allVideos.forEach((v) => v.pause()); close(); };
  return { isOpen: () => openIndex >= 0, close, playBoth, step };
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
  const PAD = 16, PAD_L = 44; // timeline padding: right / left gutter with the eye (matches CSS)

  video.muted = true; // the scene is silent on purpose
  let selected = -1;
  let cues = [];          // timed subtitles: [{ start, end, text }]
  let cueLayoutReady = false;
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
  const trackWidth = () => timeline.clientWidth - PAD - PAD_L;

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
    if (cueLayoutReady) renderCueTrack();
    timeline.setAttribute("aria-valuemax", String(Math.round(d)));
  }
  ruler.style.margin = "0"; // ruler is inside padding already

  function render() {
    const d = duration(), t = video.currentTime || 0;
    const x = PAD_L + (t / d) * trackWidth();
    playhead.style.left = `${x}px`;
    progress.style.width = `${x - PAD_L}px`;
    const tc = fmtTc(t);
    tcCur.textContent = tc; monitorTc.textContent = tc;
    tcDur.textContent = fmtTc(isFinite(video.duration) ? video.duration : 0);
    timeline.setAttribute("aria-valuenow", String(Math.round(t)));
    timeline.setAttribute("aria-valuetext", tc);
    if (cueLayoutReady) { updateSubtitle(); followPlayhead(); }
  }

  const timeAt = (clientX) => {
    const r = timeline.getBoundingClientRect();
    return clamp((clientX - r.left - PAD_L) / trackWidth(), 0, 1) * duration();
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

  /* ----- Subtitles: live box + timed cues ----- */
  const input = $("#subsInput"), out = $("#subtitleOut");
  const cueText = $("#cueText"), cueStart = $("#cueStart"), cueEnd = $("#cueEnd");
  const cueSave = $("#cueSave"), cueCancel = $("#cueCancel"), cueList = $("#cueList");
  const cueStatus = $("#cueStatus"), cueCount = $("#cueCount"), tlSubs = $("#tlSubs");
  const DRAFT_KEY = "foley-subtitles-draft";
  let editing = -1;          // index of the cue being edited, -1 = new cue
  let serverJson = "[]";     // what assets/subtitles.json currently holds
  let lastShown = null;
  let manualTimes = false;   // false = new-line times follow the playhead

  const fmtCue = (t) => {
    t = Math.max(0, t || 0);
    const m = Math.floor(t / 60), sec = t - m * 60;
    return `${pad(m)}:${sec.toFixed(2).padStart(5, "0")}`;
  };
  // Accepts 75 · 75.5 · 1:15 · 01:15.50 · 0:01:15.5
  const parseCue = (str) => {
    const parts = String(str).trim().replace(",", ".").split(":").map(Number);
    if (!parts.length || parts.some((n) => !isFinite(n) || n < 0)) return NaN;
    return parts.reduce((acc, n) => acc * 60 + n, 0);
  };
  const escHtml = (v) => String(v).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const clean = (list) => (Array.isArray(list) ? list : [])
    .map((c) => { c.start = Number(c.start); c.end = Number(c.end); c.text = String(c.text ?? "").trim(); return c; })
    .filter((c) => isFinite(c.start) && isFinite(c.end) && c.end > c.start && c.text)
    .sort((a, b) => a.start - b.start);
  const round = (t) => Math.round(t * 100) / 100;
  const toJson = () => JSON.stringify(cues.map((c) => ({ start: round(c.start), end: round(c.end), text: c.text })), null, 2);

  function activeCueIndex(t) {
    for (let i = cues.length - 1; i >= 0; i--) if (t >= cues[i].start && t < cues[i].end) return i;
    return -1;
  }
  function updateSubtitle() {
    const live = input.value;
    const idx = activeCueIndex(video.currentTime || 0);
    const text = live.trim() ? live : idx >= 0 ? cues[idx].text : "";
    if (out.textContent !== text) out.textContent = text;
    if (idx !== lastShown) {
      lastShown = idx;
      $$(".cue-item", cueList).forEach((li, i) => li.classList.toggle("is-now", i === idx));
      $$(".tl-cue", tlSubs).forEach((b, i) => b.classList.toggle("is-now", i === idx));
    }
  }

  function renderCueTrack() {
    const d = duration();
    tlSubs.innerHTML = "";
    cues.forEach((c, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tl-cue" + (i === editing ? " is-editing" : "");
      b.style.left = `${clamp(c.start / d, 0, 1) * 100}%`;
      b.style.width = `${Math.max(0.4, (clamp(c.end, 0, d) - clamp(c.start, 0, d)) / d * 100)}%`;
      b.title = `${fmtCue(c.start)} → ${fmtCue(c.end)}  ${c.text}`;
      b.innerHTML = `<span>${escHtml(c.text)}</span>`;
      b.innerHTML += `<i class="tl-cue-edge l"></i><i class="tl-cue-edge r"></i><b class="tl-cue-del" title="מחיקה">×</b>`;
      b.addEventListener("pointerdown", (e) => onCuePointerDown(e, i, b));
      tlSubs.appendChild(b);
    });
    if (!cues.length) tlSubs.innerHTML = `<span class="tl-subs-empty">— אין כתוביות מתוזמנות —</span>`;
  }

  /* Drag a clip to move it, drag its edges to trim, × to delete */
  function onCuePointerDown(e, i, el) {
    e.stopPropagation(); // don't start a timeline scrub
    if (e.button !== 0) return;
    if (e.target.classList.contains("tl-cue-del")) { e.preventDefault(); deleteCue(i); return; }
    const rect = el.getBoundingClientRect();
    const mode = e.clientX - rect.left < 8 ? "start" : rect.right - e.clientX < 8 ? "end" : "move";
    const c = cues[i], orig = { start: c.start, end: c.end };
    const secPerPx = duration() / tlSubs.clientWidth;
    const x0 = e.clientX, minLen = 0.2;
    let moved = false;
    el.setPointerCapture(e.pointerId);
    el.classList.add("is-drag");
    const onMove = (ev) => {
      const dx = (ev.clientX - x0) * secPerPx;
      if (!moved && Math.abs(ev.clientX - x0) < 3) return;
      moved = true;
      const d = duration(), len = orig.end - orig.start;
      if (mode === "move") {
        c.start = clamp(orig.start + dx, 0, Math.max(0, d - len));
        c.end = c.start + len;
      } else if (mode === "start") {
        c.start = clamp(orig.start + dx, 0, orig.end - minLen);
      } else {
        c.end = clamp(orig.end + dx, orig.start + minLen, d);
      }
      el.style.left = `${(c.start / d) * 100}%`;
      el.style.width = `${((c.end - c.start) / d) * 100}%`;
      el.title = `${fmtCue(c.start)} → ${fmtCue(c.end)}  ${c.text}`;
      seek(mode === "end" ? c.end - 0.01 : c.start + 0.01); // preview the frame being trimmed
      if (editing === i) { cueStart.value = fmtCue(c.start); cueEnd.value = fmtCue(c.end); }
    };
    const onUp = () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.classList.remove("is-drag");
      if (!moved) { seek(c.start + 0.01); startEdit(i); return; }
      const editObj = editing >= 0 ? cues[editing] : null;
      cues = clean(cues);
      editing = editObj ? cues.indexOf(editObj) : -1;
      if (editObj) { cueStart.value = fmtCue(editObj.start); cueEnd.value = fmtCue(editObj.end); }
      refreshCues();
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
  }

  function renderCueList() {
    cueCount.textContent = cues.length;
    cueList.innerHTML = "";
    cues.forEach((c, i) => {
      const li = document.createElement("li");
      li.className = "cue-item" + (i === editing ? " is-editing" : "");
      li.innerHTML = `
        <button type="button" class="cue-time" dir="ltr" title="קפיצה לזמן">${fmtCue(c.start)} → ${fmtCue(c.end)}</button>
        <span class="cue-line">${escHtml(c.text)}</span>
        <button type="button" class="cue-icon" data-a="edit" title="עריכה" aria-label="עריכה"><svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg></button>
        <button type="button" class="cue-icon danger" data-a="del" title="מחיקה" aria-label="מחיקה"><svg viewBox="0 0 24 24"><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/></svg></button>`;
      $(".cue-time", li).addEventListener("click", () => seek(c.start + 0.01));
      $('[data-a="edit"]', li).addEventListener("click", () => { seek(c.start + 0.01); startEdit(i); });
      $('[data-a="del"]', li).addEventListener("click", () => deleteCue(i));
      cueList.appendChild(li);
    });
    if (!cues.length) cueList.innerHTML = `<li class="cue-empty">עדיין אין שורות. הזיזו את המחוג, לחצו IN, כתבו טקסט, לחצו OUT ואז "הוסף שורה".</li>`;
  }

  function refreshCues(save = true) {
    lastShown = null;
    renderCueList();
    renderCueTrack();
    updateSubtitle();
    if (save) {
      const json = toJson();
      try { json === serverJson ? localStorage.removeItem(DRAFT_KEY) : localStorage.setItem(DRAFT_KEY, json); } catch (_) {}
    }
    updateStatus();
  }
  function updateStatus() {
    const dirty = toJson() !== serverJson;
    cueStatus.textContent = dirty ? "● שינויים שלא נשמרו בגיטהאב" : "✓ תואם לקובץ באתר";
    cueStatus.classList.toggle("dirty", dirty);
  }

  function followPlayhead() {
    if (editing >= 0 || manualTimes || document.activeElement === cueStart || document.activeElement === cueEnd) return;
    const t = video.currentTime || 0;
    cueStart.value = fmtCue(t);
    cueEnd.value = fmtCue(Math.min(t + 2, duration()));
  }
  function resetForm(nextStart) {
    manualTimes = false;
    editing = -1;
    cueText.value = "";
    const s0 = nextStart ?? video.currentTime ?? 0;
    cueStart.value = fmtCue(s0);
    cueEnd.value = fmtCue(Math.min(s0 + 2, duration()));
    cueSave.textContent = "הוסף שורה";
    cueCancel.hidden = true;
  }
  function startEdit(i) {
    editing = i;
    const c = cues[i];
    cueText.value = c.text;
    cueStart.value = fmtCue(c.start);
    cueEnd.value = fmtCue(c.end);
    cueSave.textContent = "עדכן שורה";
    cueCancel.hidden = false;
    switchTab("timed");
    refreshCues(false);
    $$(".cue-item", cueList)[i]?.scrollIntoView({ block: "nearest" });
  }
  function flagError(el) { el.classList.remove("err"); void el.offsetWidth; el.classList.add("err"); }
  function saveCue() {
    const text = cueText.value.trim();
    const start = parseCue(cueStart.value), end = parseCue(cueEnd.value);
    if (!text) return flagError(cueText), cueText.focus();
    if (!isFinite(start)) return flagError(cueStart);
    if (!isFinite(end) || end <= start) return flagError(cueEnd);
    const cue = { start, end, text };
    if (editing >= 0) cues[editing] = cue; else cues.push(cue);
    cues = clean(cues);
    resetForm();
    refreshCues();
    cueText.focus();
  }
  function deleteCue(i) {
    cues.splice(i, 1);
    if (editing === i) resetForm(); else if (editing > i) editing--;
    refreshCues();
  }
  function markIn() {
    const t = video.currentTime || 0;
    manualTimes = true;
    cueStart.value = fmtCue(t);
    if (!(parseCue(cueEnd.value) > t)) cueEnd.value = fmtCue(Math.min(t + 2, duration()));
    switchTab("timed");
  }
  function markOut() {
    const t = video.currentTime || 0;
    manualTimes = true;
    cueEnd.value = fmtCue(t);
    switchTab("timed");
  }

  function switchTab(name) {
    $$(".subs-tab").forEach((b) => b.classList.toggle("is-active", b.dataset.tab === name));
    $$(".subs-pane").forEach((p) => p.classList.toggle("is-active", p.dataset.pane === name));
  }
  $$(".subs-tab").forEach((b) => b.addEventListener("click", () => switchTab(b.dataset.tab)));

  input.addEventListener("input", updateSubtitle);
  $("#subsClear").addEventListener("click", () => { input.value = ""; updateSubtitle(); input.focus(); });
  $("#markIn").addEventListener("click", markIn);
  $("#markOut").addEventListener("click", markOut);
  cueSave.addEventListener("click", saveCue);
  cueCancel.addEventListener("click", () => { resetForm(); refreshCues(false); });
  [cueText, cueStart, cueEnd].forEach((el) => el.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); saveCue(); }
  }));
  [cueStart, cueEnd].forEach((el) => el.addEventListener("input", () => (manualTimes = true)));
  [cueStart, cueEnd].forEach((el) => el.addEventListener("blur", () => {
    const t = parseCue(el.value); if (isFinite(t)) el.value = fmtCue(t);
  }));

  // Export → download subtitles.json (upload it to assets/ in GitHub)
  $("#cueExport").addEventListener("click", () => {
    const blob = new Blob([toJson() + "\n"], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "subtitles.json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
  $("#cueImport").addEventListener("change", (e) => {
    const file = e.target.files[0]; if (!file) return;
    file.text().then((txt) => { cues = clean(JSON.parse(txt)); resetForm(); refreshCues(); })
      .catch(() => alertStatus("הקובץ אינו JSON תקין"));
    e.target.value = "";
  });
  $("#cueRevert").addEventListener("click", () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch (_) {}
    cues = clean(JSON.parse(serverJson)); resetForm(); refreshCues(false);
  });
  function alertStatus(msg) { cueStatus.textContent = msg; cueStatus.classList.add("dirty"); }

  // Load: assets/subtitles.json (shared, from GitHub) — a local unsaved draft wins if there is one
  function loadCues() {
    let draft = null;
    try { draft = localStorage.getItem(DRAFT_KEY); } catch (_) {}
    const apply = (fromServer) => {
      serverJson = JSON.stringify(clean(fromServer).map((c) => ({ start: round(c.start), end: round(c.end), text: c.text })), null, 2);
      let list = fromServer;
      if (draft) { try { list = JSON.parse(draft); } catch (_) {} }
      cues = clean(list);
      refreshCues(false);
    };
    fetch(SUBTITLES_FILE, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then(apply)
      .catch(() => apply(typeof SUBTITLES_FALLBACK !== "undefined" ? SUBTITLES_FALLBACK : []));
  }
  cueLayoutReady = true;
  resetForm(0);
  refreshCues(false);
  loadCues();

  /* ----- Show / hide all subtitles (eye on the subtitle track, or S) -----
     Starts HIDDEN on every page load, so the subtitles are a surprise
     when you reveal them during the workshop.                          */
  const subsToggle = $("#subsToggle");
  const timelineWrap = $(".timeline-wrap");
  function setSubsVisible(on) {
    monitor.classList.toggle("subs-off", !on);
    timelineWrap.classList.toggle("subs-off", !on);
    subsToggle.setAttribute("aria-pressed", on ? "true" : "false");
    subsToggle.setAttribute("aria-label", on ? "הסתרת כתוביות" : "הצגת כתוביות");
  }
  const toggleSubs = () => setSubsVisible(monitor.classList.contains("subs-off"));
  subsToggle.addEventListener("pointerdown", (e) => e.stopPropagation()); // not a scrub
  subsToggle.addEventListener("click", (e) => { toggleSubs(); e.currentTarget.blur(); });
  setSubsVisible(SETTINGS.subtitlesVisibleAtStart);

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
    toggle, step, seek, toggleFs, isFs, markIn, markOut, toggleSubs,
    deleteSelected: () => { if (editing >= 0) deleteCue(editing); },
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

{
  const prevEnter = onEnterHandlers[SLIDE.LAYERS], prevLeave = onLeaveHandlers[SLIDE.LAYERS];
  onEnterHandlers[SLIDE.LAYERS] = () => { prevEnter && prevEnter(); LockWaves.start(); };
  onLeaveHandlers[SLIDE.LAYERS] = () => { prevLeave && prevLeave(); LockWaves.stop(); };
  if (current === SLIDE.LAYERS) LockWaves.start();
}
