---
title: "Kindred"
tagline: "A family tree the whole family can open, with the stories that go with it."
summary: >-
  A self-hosted web app for a family's history: a tree everyone can browse,
  houses with coats of arms, photographs, places and memories, and an optional AI assistant.
category: web
status: active
visibility: public
featured: 4
repo: "niklas-heer/kindred"
docs: "https://github.com/niklas-heer/kindred/tree/main/docs"
started: 2026-09-19
stack: ["TypeScript", "React", "TanStack Start", "SQLite", "Cloudflare D1"]
cover: "./kindred/cover.webp"
coverAlt: "Kindred's Dynasty view of an invented medieval realm: generations of portrait cards, a person panel on the left and a minimap of the whole tree"
gallery:
  - src: "./kindred/person.webp"
    alt: "A person's page for an invented king: drawn portrait, closest family, a memory, a life timeline and a map"
    caption: "A person's page, with invented sample data"
  - src: "./kindred/arms.webp"
    alt: "The coat of arms designer with a blue shield, a white cross and a gold star, beside charges and tinctures"
    caption: "The arms designer explains each choice"
  - src: "./kindred/atlas.webp"
    alt: "The Atlas: a map of northern Europe with birthplaces of an invented family and a timeline slider"
    caption: "The Atlas replays where the family was born"
highlights:
  - "Every family is one SQLite or D1 database"
  - "Passkey sign-in and per-field privacy"
  - "GEDCOM and Markdown export"
---

In most families one person keeps the records, in a folder or a program nobody else can open. I wanted ours somewhere everyone could reach: find yourself, see how you're related to the great-aunt in the old photograph, and add what you remember.

Kindred is a web app for that. The tree opens on one person and the people around them, as an hourglass of ancestors and descendants, a dynasty following a house down the generations, or a straight line back. Zoom out and the cards turn into name plates, then into small shields, and a minimap always shows the whole family. Search finds anyone and tells you how they are related to you. Each person has a page with a timeline, relatives, stories and a drawn portrait you can adjust.

The parts I enjoy most are around the edges. A branch can be a house with a coat of arms you draw in a designer that explains heraldry as you go. The Chronicle collects sayings, recipes and anecdotes, the Gallery holds tagged photographs, the Atlas maps where everyone was born, and the Almanac keeps birthdays and memorial days. An assistant can answer questions and suggest changes, but only if a steward adds an API key, and you approve every change yourself.

You run it yourself, with Docker, on Node, or on Cloudflare Workers. Everyone signs in with a passkey, roles decide who may edit, and notes can be private, for editors or for the whole family. Every family lives in its own database, and it exports to GEDCOM and Markdown.

The first version, from September, was a Rust command-line tool over a Markdown archive. Version 2 replaced it with this shared web app in November. The pictures here use the invented families that ship with the repository.
