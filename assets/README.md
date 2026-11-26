# assets/ — where your media files go

Drop your files into this folder using **exactly** these names
(or change the paths in `index.html` / the CONFIG block at the top of `script.js`).

| Slide | File | Notes |
|---|---|---|
| 3 · סרטון מבוא | `assets/intro-foley.mp4` | Your intro video (H.264 MP4 plays everywhere). Optional poster frame: `assets/intro-poster.jpg` |
| 5 · נחשו ממה עשוי הצליל | `assets/guess-example.mp4` | The short clip shown beside the cards |
| 5 · cards | `assets/cards/clip1.mp4` … `clip4.mp4` | Short clip on the front of each card (plays with sound) |
| 5 · cards | `assets/cards/answer1.mp4` … `answer4.mp4` | Back of each card: the answer clip (how the sound is really made, plays with sound) |
| 4 · סצנה במסך מלא | `assets/scene-video.mp4` | The 20-second scene before the guess game |
| 6 · פולי בפעולה | `assets/foley-performance.mp4` | Full-screen video of a Foley artist at work |
| 7 · אולפן חי | `assets/silent-scene.mp4` | Played muted on purpose |
| 5 · subtitles | `assets/subtitles.json` | Timed subtitles. Created by the ייצוא JSON button on slide 5 |
| 5 · music | `assets/track1.mp3`, `assets/track2.mp3`, `assets/track3.mp3` | The three score options |

## Changing texts
- **Card answers / questions / images** → `GUESS_CARDS` at the top of `script.js` (add or remove cards freely; 4–6 looks best).
- **Track titles** → `MUSIC_TRACKS` at the top of `script.js`.
- **Arrow direction, timecode fps, step size** → `SETTINGS` in `script.js`.

## Tips
- Any missing file shows a tidy "NO SIGNAL" / placeholder instead of breaking the page, so you can deploy before all media is ready.
- Images: JPG or PNG, roughly square (4:4.4) for cards. ~800px wide is plenty.
- Keep videos reasonably small (under ~50 MB each) for fast loading on Netlify; GitHub rejects single files over 100 MB.
- Browsers block video *with sound* from starting automatically — that's why every video starts on a click / Space.
