---
title: "Overhead Overdrive"
tagline: "A 3D racing game in which you drive a classroom overhead projector."
summary: >-
  A browser racing game with a very questionable choice of vehicle: race an
  overhead projector on casters through a school, drift, boost the lamp and fire laser pointers.
category: games
status: paused
visibility: public
repo: "niklas-heer/overhead-overdrive"
homepage: "https://overhead-overdrive.vercel.app"
started: 2026-09-04
stack: ["TypeScript", "Three.js", "Vite", "Upstash Redis"]
cover: "./overhead-overdrive/cover.webp"
coverAlt: "A race in the school atrium: four overhead projectors with stick-figure riders bunched together on a curving track, with the lap timer, standings and minimap"
gallery:
  - src: "./overhead-overdrive/menu.webp"
    alt: "The start screen: 'Zero aero. All overdrive.' beside a projector with an orange rider, and the three circuits to choose from"
    caption: "Pick a circuit and a projector"
  - src: "./overhead-overdrive/kocher-park.webp"
    alt: "A race on the Kocher Park circuit, past trees and a school building, with rival projectors close behind"
    caption: "Kocher Park, the fastest of the three circuits"
posts:
  - "/posts/2026/09/2026-09-04_projector-racing/"
highlights:
  - "Three circuits, three laps, three rivals"
  - "Drift, lamp boost and laser pointers"
  - "Keyboard, touch and tilt steering"
---

When I was about thirteen, my friends and I had an idea for a racing game with overhead projectors. I never made it, and I never learned 3D modelling either. When GPT-6 Astra came out I wanted to see what it could do, and the projector game seemed like a fair test.

Overhead Overdrive is the result. You pick a classroom projector, a handling setup and a stick-figure rider standing on the footboard, then race three laps against three rivals with their own driving styles. The tracks run through a stylised school: an indoor atrium under a glass roof, a covered passage between school wings, and a loop through a park by the river. The buildings are procedural, built in the browser from simple shapes and generated materials.

The driving is arcade with some physics behind it. The simulation runs at a fixed 120 Hz, with drag, limited grip and a flexing mast. Hold Space while steering to charge a caster drift, release it for a speed kick, or overdrive the lamp until it overheats. Supply boxes hand out laser pointers, shields and capacitor boosts, and the riders occasionally comment. Mostly on walls.

Over the following week it grew past a single race: personal bests per course, an online club with weekly school records and replayable ghosts, private rooms for up to four friends, and touch and tilt steering on iPhone and iPad. Online play runs on a small free database tier with a monthly request budget, so it is meant for friends and family. Offline racing needs no backend at all.

It's playable at the link above. I haven't worked on it since the middle of September.
