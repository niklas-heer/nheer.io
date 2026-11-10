---
title: "Earlog"
tagline: "Your listening, measured."
summary: >-
  A podcast player that records every listening session, so statistics come from your whole history, which stays a single file you can export. Work in progress.
category: apps
status: experimental
visibility: private
started: 2026-09-26
stack: ["Rust", "Leptos", "WebAssembly", "SQLite", "axum"]
cover: "./earlog/cover.webp"
coverAlt: "Earlog's dark home screen playing an invented episode, A quiet week on the Moon from the invented show Orbit Weekly"
gallery:
  - src: "./earlog/library.webp"
    alt: "The library view with artwork for invented shows such as Field Notes from the Allotment and Kleine Geschichte"
    caption: "The library, with invented shows"
  - src: "./earlog/german.webp"
    alt: "The home screen in German, with the navigation reading Hören, Deine Mediathek, Als Nächstes and Hörzeit"
    caption: "The same screen in German"
  - src: "./earlog/listening.webp"
    alt: "The listening view with time listened, time saved at speed, episodes finished and a seven-day chart, after a minute of listening"
    caption: "Statistics after the first minute"
highlights:
  - "Every listening span is recorded"
  - "Your history is one SQLite file"
  - "English and German from the start"
---

My podcast app remembers where I stopped in each episode. I wanted one that also knows how long I listened, at what speed, and what I finished. Earlog is a podcast player and listening service built around that idea, and it is still early.

The player should feel familiar if you have used Pocket Casts: speed control, skip buttons, Up Next and a sleep timer. Underneath, every listening span becomes an entry in an append-only log of operations. Statistics are computed from that log instead of kept as counters, and so will be the levels and yearly review I have planned. Skipped parts don't count as listening, and the time saved by listening faster is its own number. Your whole history is one SQLite file you can export at any time.

It is a Rust workspace. The interface is rendered on the server with Leptos and hydrated with Rust compiled to WebAssembly, in English and German. One crate parses RSS, Atom and OPML leniently and keeps a show's identity when its feed moves or its episode IDs change, so your history follows the show. Another analyses audio offline as groundwork for trimming silence.

What works today is a local library. You can follow real feeds or import an OPML export, filter and star episodes, queue them, listen, and see the statistics grow. Accounts, sync between devices, podcast search and the interfaces I have planned for agents (GraphQL, MCP and a command-line tool) are not built yet. When it is ready for other people I want it hosted in Germany, but I have no date for that.

The screenshots show a local build running on invented shows, artwork and episodes.
