# אמנות הפולי · The Foley Art — workshop presentation

Static site, zero build steps: `index.html` + `style.css` + `script.js` + `assets/`.

## Run locally
Double-click `index.html` to open it in Chrome — that's enough to rehearse.
If you want a local server, use one that supports video seeking, e.g. `npx serve .`
(Python's `http.server` does not support byte ranges, so the slide-5 timeline can't scrub there.
Netlify and GitHub Pages both support it.)

## Deploy
- **Netlify:** drag this folder onto https://app.netlify.com/drop, or connect the GitHub repo (build command: none, publish directory: `/`).
- **GitHub Pages:** push to a repo → Settings → Pages → Deploy from branch `main` / root.

## Controls
| Where | Key | Action |
|---|---|---|
| All slides | ← / → | Next / previous slide (Hebrew RTL: ← = next; change in `SETTINGS.rtlArrows`) |
| All slides | PageDown / PageUp | Next / previous slide (also works on slide 5) |
| Slide 1 | Enter / Space | Start workshop |
| Slide 2 | Space / Enter | Reveal next layer |
| Slides 3–4 | Space | Play / pause video (F = fullscreen on slide 3) |
| Slide 5 | Space | Play / pause video + selected music |
| Slide 5 | ← / → | Back / forward 1 second |
| Slide 5 | F, double‑click | Fullscreen monitor (with subtitles); Esc exits |
| Slide 5 | Esc in subtitle box | Leave the box and return keyboard control |

Media files: see `assets/README.md`. Texts for cards and tracks: CONFIG block at the top of `script.js`.
