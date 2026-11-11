---
title: "Family travel blog"
tagline: "Trip updates sent from a phone chat, for the family back home."
summary: >-
  A private travel blog fed by a Telegram bot: send text, photos or a voice note, and a model turns them into a post the family can read in English or German.
category: web
status: maintained
visibility: private
started: 2026-01-01 # hideActivity: the year alone is public
stack: ["TypeScript", "Astro", "TanStack Start", "Cloudflare Workers", "Telegram Bot API"]
cover: "./travel-blog/cover.webp"
coverAlt: "Diagram of the publishing pipeline: a message to a Telegram bot becomes a draft, a model writes the post, a preview offers Publish or Discard, and a workflow publishes it"
hideActivity: true
posts:
  - "/posts/2026/11/2026-11-11_family-travel-blog-from-telegram/"
highlights:
  - "Posts written from a Telegram chat"
  - "Every page in English and German"
  - "Behind one shared password"
---

For a family trip I wanted the people at home to follow along without installing an app or joining another group chat. The result is a small private blog: a timeline of short updates, photos, videos and places, behind one shared password.

Posting had to work from a phone at the end of a long day, and for everyone on the trip. So posts arrive through a Telegram bot. You send it whatever you have: a few lines of text, photos, a video, a voice note or your location, in German or English. Messages that arrive together become one draft. An audio model transcribes voice notes, and a language model turns the draft into a short English post, following written rules for voice and privacy. The bot answers with a preview and two buttons, Publish and Discard. Publish starts a workflow that resizes the photos, re-encodes video, commits the post and deploys the site. Replying to the bot's "It's live" message changes the post, and `/undo` takes it down again.

Readers get a timeline grouped by day with a "New" badge for updates since their last visit, a route map, a photo viewer that picks smaller files on slow connections, emoji reactions and push notifications. Every page also exists in German, and posts were translated automatically when they went live.

During the trip the site was built with Astro and ran on Vercel, with the bot as a Vercel Function. Afterwards I moved it to a Cloudflare Worker running TanStack Start, with posts in D1 and photos and video in R2. Posts, reactions and push sign-ups all came along. The bot is retired now, and the blog stays online as a record of the trip.

Every real page is full of family photos, so the picture here is a diagram of how a post gets made.
