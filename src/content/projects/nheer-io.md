---
title: "nheer.com"
tagline: "This website: a blog, my reading and listening, and an octopus in the corner."
summary: >-
  My personal site, built with Astro. Besides the blog it shows live reading and
  podcast statistics, and a snarky octopus called Inky, refreshed and published by my homelab.
category: web
status: active
visibility: public
repo: "niklas-heer/nheer.io"
homepage: "https://nheer.com"
started: 2019-08-11
stack: ["Astro", "TypeScript", "Tailwind CSS", "PostgreSQL", "Lottie", "Playwright"]
cover: "./nheer-io/cover.webp"
coverAlt: "The nheer.com home page in dark mode: a terminal card with whoami and now, and Inky the purple octopus in the corner saying something snarky"
gallery:
  - src: "./nheer-io/reading.webp"
    alt: "The Reading page with the yearly goal, pages per day, books finished and a bar chart of books per year"
    caption: "Reading, from Hardcover"
  - src: "./nheer-io/listening.webp"
    alt: "The Listening page with total listening hours, subscriptions, completed episodes and a chart for the current month"
    caption: "Listening, from Pocket Casts"
posts:
  - "/posts/2025/11/2025-11-29_hello-astro/"
  - "/posts/2025/11/2025-11-29_reading-page-hardcover/"
  - "/posts/2026/09/2026-09-07_homelab-for-the-family/"
  - "/posts/2026/09/2026-09-20_an-octopus-in-the-corner/"
highlights:
  - "Reading and listening stats from live data"
  - "Inky writes his lines from tech headlines"
  - "Refreshed, tested and published by my homelab"
---

You are looking at it. This site is where I write about what I build and learn, and where a few small projects of mine live.

It has moved between generators over the years: Jekyll in 2014, Hugo after that, and since November 2025 Astro. Astro builds static pages from typed Markdown and MDX content, and lets me add interactive pieces only where a post needs them, like the diagrams and small demos in recent articles.

The pages I enjoy most are not posts. The Reading page pulls my books from Hardcover and turns them into a yearly goal, pages per day and a chart of books per year. The Listening page does the same for podcasts from Pocket Casts. On the home page, a small terminal answers `whoami` and `now`, and takes a few more commands if you type `help`.

Then there is Inky. On a wide screen a purple octopus peeks in from the bottom-left corner. Click him and he says something snarky, usually about a tech headline. A job in my homelab fetches the news, has a small model write his lines, and the build bakes them into the page. He doesn't chat and he doesn't remember you.

That homelab also does the publishing. An Argo workflow refreshes the site's data, keeping the podcast history and Inky's comments in a private PostgreSQL database, then builds the site, runs browser tests against the result and deploys it if they pass.

The posts below tell the longer stories: moving to Astro, the reading page, the homelab, and Inky.
