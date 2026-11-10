---
title: "Shoalow"
tagline: "A deep-sea card game for 2 to 10 players, right in the browser."
summary: >-
  A browser card game where you keep your score low: pearls help, anglerfish hurt,
  and three of a kind in a column vanish. Play with friends, bots or both, no account needed.
category: games
status: active
visibility: public
repo: "niklas-heer/shoalow"
homepage: "https://shoalow.fly.dev"
started: 2026-09-29
stack: ["TypeScript", "Bun", "Svelte", "SQLite", "Fly.io"]
cover: "./shoalow/cover.webp"
coverAlt: "A game of Shoalow in progress: four bots' card grids across the top, the draw and discard piles, your own sea-creature cards and the scores"
gallery:
  - src: "./shoalow/cards.webp"
    alt: "The cards page: a pearl clam, conch, starfish, krill, shrimp, seahorse, jellyfish, octopus, sea turtle and crab with their values"
    caption: "Meet the shoal"
highlights:
  - "Up to ten seats, filled with friends or bots"
  - "Your browser never sees a hidden card"
  - "Fits on one screen, phone included"
---

I wanted to play Skyjo with colleagues who were not in the same room. Shoalow is the result: the same rules, with its own name, artwork and sea creatures.

Everyone gets twelve face-down cards in a grid and turns two of them over. On your turn you take the top discard or draw a card, and swap it into your grid or throw it away and reveal one of yours. Three equal cards in a column disappear. When someone has revealed everything, the others get one more turn, and the lowest total wins once someone reaches the score goal. Pearl clams are worth minus two. Anglerfish are worth twelve, and you will meet them.

You open the site, type a name, create a table and send the link. Easy and normal bots fill empty seats, so it also works alone, and a practice game with a coach explains each step. The host can hide the running sums or show less of the piles, which turns counting and memory into part of the game. The table always fits on one screen, upright or sideways, and you can add it to a phone's home screen like an app.

Fairness was the part I spent the most care on. The server keeps each deck secret and sends every player only what they are allowed to see, so there is nothing to peek at in the browser. Shuffles use ChaCha20 seeded from the system's secure random source. Simulations play thousands of games and throw malformed messages at whole tables to check every rule after every step.

It runs on one small Fly.io machine that sleeps when nobody plays, and saves every move to SQLite. I built it over four days around the turn of September and October. It has no ads and stores nothing personal.
