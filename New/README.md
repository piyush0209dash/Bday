# Tanya’s Kingdom: stage 1 (the world)

Static site for Cloudflare Pages. No build step.

## Deploy
1. Cloudflare dashboard → Workers & Pages → Create → Pages → **Upload assets** (direct upload).
2. Upload this whole folder (keep `functions/` and `stars.bin`). Deploy.

## What is in stage 1
- Map V1 in 3D: castle, grounds wall, King/Queen/Princess quarters, royal quarters, Piyush’s two houses, Royal City wall with gate and watch towers, Royal Museum (shell), marketplace, Theta River, mountain range.
- First person: WASD + mouse (click to lock), Shift to run; phone: left stick + drag right side.
- Real sky over Khurda (20.18°N, 85.62°E): Sun, Moon with true phase and position, and 116,168 stars from HYG v42 (stars that never rise at Khurda are removed). Positions are for the exact current time.
- Live weather via `/api/weather` (Open-Meteo): wind speed/direction sway the trees and drift the clouds; cloud cover and rain follow Khurda.

## Testing tricks (add to the URL)
- `?time=2027-01-01T00:00:00+05:30` shows the sky at that moment (IST).
- `?time=2026-12-24T20:00:00+05:30&speed=600` time-lapse at 600x.
- `?weather=rain` forces rain and strong wind.

## Not in stage 1 yet
Interiors and the start-point logic (she currently starts in the Princess’s garden), memories and diary pages, Royal Museum contents, sounds, wish machine, portals and the finale.
