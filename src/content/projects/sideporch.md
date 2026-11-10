---
title: "Sideporch"
tagline: "A small, self-hosted team chat in one binary."
summary: >-
  Channels, threads, direct messages, polls and search for a team, a club or a
  family, on a server you control. One Rust program and one data directory, with
  Slack import and Slack-compatible webhooks.
category: apps
status: active
visibility: public
featured: 5
repo: "niklas-heer/sideporch"
homepage: "https://sideporch.app"
docs: "https://sideporch.app/docs/"
started: 2026-09-27
stack: ["Rust", "axum", "SQLite", "maud", "Lua"]
install: "brew install niklas-heer/tap/sideporch"
cover: "./sideporch/cover.webp"
coverAlt: "Sideporch in dark mode with the general channel open: a release checklist, a ranked-choice poll on where to celebrate, and a thread about release notes on the right"
gallery:
  - src: "./sideporch/automation.webp"
    alt: "The Sideporch automation editor with a Lua script that asks for deploy approvals, the events it listens to, and a test run panel"
    caption: "Automations are Lua scripts, written and tested in the browser"
  - src: "./sideporch/phones.webp"
    alt: "Two phone screens of Sideporch, the channel list on the left and a thread on the right"
    caption: "On phones it installs like an app"
highlights:
  - "One binary, no database server"
  - "Slack import and Slack-compatible webhooks"
  - "Lua automations, testable in the browser"
---

Slack works well, but it is someone else's server, and a small group pays for it either in money or in history that disappears. Many self-hosted alternatives ask for a database server, a mail server and an afternoon. Sideporch is my attempt at a chat that a team, a club or a family can run on a small VPS, a home server or an ARM board without any of that.

It is one program and one data directory. The first person to open it becomes the admin and invites everyone else with a link; nobody needs an email address. Backups are a download from the browser or a daily file, and moving to another server means copying that directory.

Inside, it tries to feel familiar: public and private channels, threads, direct messages, mentions, reactions, Markdown with diagrams, files, pins, reminders and messages sent later. Polls can rank options to find what most people can live with. Search corrects typos using your own team's words. On phones it installs as a web app with push notifications from your own server.

Beyond chatting, there is plumbing. Monitoring and CI tools post through Slack-compatible webhooks, so something like Gatus works unchanged. Automations are small Lua scripts that you write and test in the browser, or let an AI write through MCP. Separate Sideporch servers can share channels with signed requests, and a Slack export can be imported, history included.

The web interface is rendered on the server, and the styles are compiled in Rust at build time, so there is no Node toolchain anywhere. It is early: it works end to end, and there will be rough edges and breaking changes before a stable release. A [live demo](https://sideporch-demo.fly.dev) starts over every night.
