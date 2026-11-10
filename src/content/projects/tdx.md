---
title: "tdx"
tagline: "Your todos, in Markdown, done fast."
summary: >-
  A terminal todo manager for the Markdown checklists you already keep. Vim-style
  keys, sections, filters and scriptable JSON, and the file stays plain Markdown.
category: tools
status: active
visibility: public
featured: 1
repo: "niklas-heer/tdx"
homepage: "https://niklas-heer.github.io/tdx/"
started: 2025-11-21
stack: ["Go", "Bubble Tea", "Lip Gloss", "Goldmark"]
install: "brew install niklas-heer/tap/tdx"
cover: "./tdx/cover.webp"
coverAlt: "tdx in a terminal showing a Markdown todo list with Backend, Frontend and Release headings, tags, priorities and due dates"
gallery:
  - src: "./tdx/sections.webp"
    alt: "The tdx section overview listing the Backend, Frontend and Release headings with their completion counts"
    caption: "The section overview, with progress per heading"
  - src: "./tdx/scripting.webp"
    alt: "A terminal running tdx list with tag and priority filters, JSON output piped into jq, and tdx done marking a task complete"
    caption: "The same file from scripts, with filters and JSON"
posts:
  - "/posts/2025/11/2025-11-29_building-tdx/"
  - "/posts/2026/07/2026-07-17_saving-a-markdown-file/"
  - "/posts/2026/09/2026-09-20_the-compiler-can-yell-at-somebody-else/"
highlights:
  - "Tasks stay in a plain Markdown file"
  - "Vim-style keys and a command palette"
  - "Scriptable with filtered JSON output"
---

Most of my projects already have a list of things to do: a `todo.md`, a checklist in the README, a few `- [ ]` lines under a heading. tdx is a small terminal app for exactly those files. There is no account and no database. You open the Markdown file you already have, move through it with `j` and `k`, toggle tasks with the space bar, and the file stays something any editor and any Git diff can read.

On top of that come tags, priorities like `!p1`, due dates, filters for each of them, a section overview with completion counts per heading, saved views, undo, and a Helix-style command palette behind `:`. Every change goes through an atomic save that notices when another program has changed the file in the meantime, and tdx keeps its own version history with diffs, so a careless edit is easy to take back.

It also works without the interface. `tdx list` filters by status, tag, priority, due date or section and can print JSON, and the write commands can be guarded with a revision token so a script doesn't act on a list that changed under it. Indexes, tags and due dates come out as fields, ready for `jq`.

The first version was TypeScript on Bun with Ink. A day later I rewrote it in Go, mostly to get one small binary. In September I measured a Rust port of the Markdown handling: much faster, and still nobody would have noticed, because the Go version already edits a thousand tasks in a few milliseconds. So it stayed in Go.

tdx runs on macOS, Linux and Windows, and releases come with checksums and signed provenance. My own configuration for it lives in my dotfiles, and it keeps getting small improvements.
