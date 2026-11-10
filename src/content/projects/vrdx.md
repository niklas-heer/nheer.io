---
title: "vrdx"
tagline: "Keep the decision. Keep the why."
summary: >-
  Engineering decision records as Markdown files in your repository, with stable
  IDs, explicit replacement history, a CLI for people and AI agents, and a local
  dashboard that maps how decisions connect.
category: tools
status: active
visibility: public
repo: "niklas-heer/vrdx"
started: 2025-09-30
stack: ["Rust", "TOML", "Markdown", "JavaScript"]
install: "brew install niklas-heer/tap/vrdx"
cover: "./vrdx/cover.webp"
coverAlt: "The vrdx dashboard in dark mode with the decision Store plant data in SQLite selected: a map of its connected decisions on the left and its decision, why and consequences on the right"
gallery:
  - src: "./vrdx/dashboard-overview.webp"
    alt: "The vrdx dashboard overview with seven decisions, filters by status and topic, and the start of the connection map"
    caption: "The overview: status, topics and the decision map"
  - src: "./vrdx/record.webp"
    alt: "A terminal showing a decision record as a Markdown file with TOML metadata including a supersedes link, followed by vrdx validate reporting that the collection is valid"
    caption: "Each decision is a short Markdown file"
posts:
  - "/posts/2026/09/2026-09-20_the-compiler-can-yell-at-somebody-else/"
highlights:
  - "One Markdown file per decision"
  - "Stable IDs and explicit replacement chains"
  - "Read-only dashboard built into the binary"
---

Decisions outlive the conversations that produced them. Half a year later, someone asks why the project uses SQLite, and the answer is in a chat thread nobody can find. vrdx keeps the choice, the reasoning and the trade-offs in a small Markdown file next to the code, where they get reviewed and committed like everything else.

`vrdx new "Store plant data in SQLite"` creates a proposed record with a short template: one sentence for the decision, a brief why, a few benefits and costs. Each record carries a stable ID in its metadata, so renaming the file doesn't break anything, and relationships are explicit: what this decision replaces, what it depends on, what it relates to. `vrdx validate` complains when the history doesn't add up, for example when a replaced decision isn't marked as superseded.

From there it is a matter of finding things again. `list`, `search`, `chain` and `relations` work in the terminal, and every command can answer in JSON. `vrdx context` gives an AI agent a compact summary with source paths, and `vrdx init` installs a skill so agents know how to read and write records. `vrdx dashboard` starts a local, read-only web view with a map of how decisions connect and the full reasoning beside it. There's no database and no account; the Markdown files are the source.

vrdx began in autumn 2025 as a Python tool with a terminal interface. In September 2026 I rewrote it in Rust, and it now ships as one native binary for macOS and Linux. Several of my other projects keep their decisions with it, Sideporch and my dotfiles among them.
