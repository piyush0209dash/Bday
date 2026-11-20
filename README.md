# Bday 👑

A small birthday website: a starlit landing page, a year-by-year archive, and an interactive 3D castle experience for each birthday. Built with plain HTML, CSS and JavaScript, so there is nothing to install or build.

## Structure

```
.
├── index.html        # Landing page ("The Royal Archive") with background music toggle
├── site.css          # Landing page styles
├── site.js           # Music toggle logic
└── Archive/
    ├── Index.html    # Archive page listing every year
    ├── archive.css   # Archive page styles
    └── 2026/
        ├── index.htm # 2026 birthday experience (3D castle)
        ├── style.css
        └── script.js # Scene, mini-games and birthday logic (Three.js)
```

## Run locally

No build step. Open `index.html` in a browser, or serve the folder to avoid any local-file restrictions:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

An internet connection is needed for Google Fonts, Three.js (r128, from cdnjs), the audio files and the embedded games.

## Deploy

Works on any static host. For GitHub Pages: **Settings → Pages → Deploy from a branch → `main` / root**.

## How the 2026 page works

- The experience checks the date in IST (Indian Standard Time) and unlocks the special sequence on **June 12**. On other days it shows a countdown to the next one.
- **Controls:** WASD / left stick to move, mouse / right stick to look, **E** or tap to interact.
- **Time Simulator:** press **T** (or tap the minimap) to open it and set a date. This is for testing only; the chosen time is kept in `sessionStorage` and cleared with *Reset to Reality*.

## Adding a new year

1. Create `Archive/<year>/` with its own `index.html`, CSS and JS.
2. Add a `year-card` link for it in `Archive/Index.html`.
3. Update the date logic in the new year's script if the date changes.

## Assets to keep in the repo

The 2026 page expects a photo file in `Archive/2026/` (referenced by name in `script.js`). If it is missing, the character image will not load, so make sure it is committed with the exact same filename.

## Tech

- HTML, CSS, vanilla JavaScript
- [Three.js](https://threejs.org/) r128 for the 3D scene
- Google Fonts: Cinzel, Cinzel Decorative, DM Sans, Lato
- Background audio hosted on Pixabay

## Notes

- Some embedded games load from third-party sites and may be blocked from loading inside a frame; the page shows a notice when that happens.
- Made as a personal gift. Please don't reuse the personal text or images without permission.
