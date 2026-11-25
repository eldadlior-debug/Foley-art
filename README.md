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
| Slide 5 | S (or the subtitles button on the monitor) | Hide / show all subtitles, also in fullscreen |
| Slide 5 | I / O | Set the timed-subtitle start / end to the playhead |
| Slide 5 | Esc in a text box | Leave the box and return keyboard control |

## Timed subtitles (slide 5)
Open the **כתוביות מתוזמנות** tab: move the playhead, press **IN**, type the line, press **OUT**, then **הוסף שורה** (or Enter).
Each line becomes a purple clip on the timeline: drag it to move it, drag its edges to trim the start/end, and use × (or select it and press Delete) to remove it. Click a clip or a list row to jump to it and edit the text. Typing a line and pressing Enter places it at the playhead (2 s long).
Edits are kept in your browser until you share them: press **ייצוא JSON** and upload the downloaded
`subtitles.json` into `assets/` on GitHub (replace the old file). Everyone then sees the same subtitles.
**טען מהאתר** throws away your local edits and reloads the version from GitHub.
Live-typed text (tab **כתוביות חיות**) always shows on top of the timed lines while the box isn't empty.

Media files: see `assets/README.md`. Texts for cards and tracks: CONFIG block at the top of `script.js`.
