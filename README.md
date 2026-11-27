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

## Offline (iPad)
Open the site once in Safari while online: a note in the bottom corner shows the download and then
"✓ מוכן לשימוש בלי אינטרנט". Then Share → Add to Home Screen and open it from the icon; it runs with no internet.
`sw.js` serves the saved files; the list of files is `offline-assets.js`.
**After changing any file, run `python3 tools/build-offline-list.py` before committing**, so iPads download the new version.

## Controls
| Where | Key | Action |
|---|---|---|
| All slides | ← / → | Next / previous slide (Hebrew RTL: ← = next; change in `SETTINGS.rtlArrows`) |
| All slides | PageDown / PageUp | Next / previous slide (also works on slide 7) |
| Slide 1 | Enter / Space | Start workshop |
| Slide 2 | Space / Enter | Reveal next layer |
| Slides 4 and 6 | Space / F | Play the full-screen video / real fullscreen |
| Slides 3–5 | Space | Play / pause video (F = fullscreen on slide 3) |
| Slide 7 | Space | Play / pause video + selected music |
| Slide 7 | ← / → | Back / forward 1 second |
| Slide 7 | F, double‑click | Fullscreen monitor (with subtitles); Esc exits |
| Slide 7 | S (or the eye next to the subtitle track) | Show / hide all subtitles, also in fullscreen. They start hidden on every load (`SETTINGS.subtitlesVisibleAtStart`) |
| Slide 7 | I / O | Set the timed-subtitle start / end to the playhead |
| Slide 7 | Esc in a text box | Leave the box and return keyboard control |

## Timed subtitles (slide 7)
Open the **כתוביות מתוזמנות** tab: move the playhead, press **IN**, type the line, press **OUT**, then **הוסף שורה** (or Enter).
Each line becomes a purple clip on the timeline: drag it to move it, drag its edges to trim the start/end, and use × (or select it and press Delete) to remove it. Click a clip or a list row to jump to it and edit the text. Typing a line and pressing Enter places it at the playhead (2 s long).
Edits are kept in your browser until you share them: press **ייצוא JSON** and upload the downloaded
`subtitles.json` into `assets/` on GitHub (replace the old file). Everyone then sees the same subtitles.
**טען מהאתר** throws away your local edits and reloads the version from GitHub.
Live-typed text (tab **כתוביות חיות**) always shows on top of the timed lines while the box isn't empty.

Media files: see `assets/README.md`. Texts for cards and tracks: CONFIG block at the top of `script.js`.

## Presenting from an iPad

Open the site in Safari, tap Share → **Add to Home Screen**, then launch it from the home-screen icon.
It opens full screen, without Safari's address bar and tabs. Swipe right for the next slide, left for the previous one
(or tap the arrows at the bottom).
