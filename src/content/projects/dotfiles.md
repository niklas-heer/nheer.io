---
title: "dotfiles"
tagline: "My Mac setup, managed with chezmoi, with the reasons written down."
summary: >-
  The configuration for my Macs, managed with chezmoi: Homebrew packages, a fast
  Zsh setup, editor and terminal settings, shared instructions for coding agents,
  and a log of the decisions behind them.
category: infrastructure
status: active
visibility: public
repo: "niklas-heer/dotfiles"
started: 2025-01-13
stack: ["chezmoi", "Zsh", "Homebrew", "Ghostty", "vrdx"]
cover: "./dotfiles/cover.webp"
coverAlt: "The vrdx dashboard showing the dotfiles decision log: 34 decisions, 29 accepted and 5 superseded, with topics such as shell, tooling and ai and a map of connected decisions"
gallery:
  - src: "./dotfiles/decision.webp"
    alt: "The decision Zsh only, with cached startup opened in the vrdx dashboard, next to the earlier decision Standardizing on zsh"
    caption: "Each change to the setup comes with its reasoning"
  - src: "./dotfiles/layout.webp"
    alt: "A terminal listing the dot_config folder of the chezmoi source with atuin, ghostty, helix, keywink, mise, tdx, zed, zsh and others, then the newest decision files"
    caption: "chezmoi's source layout and the newest decision records"
posts:
  - "/posts/2026/09/2026-09-19_the-repository-between-my-repositories/"
highlights:
  - "A new Mac is set up with chezmoi init"
  - "Zsh only, starting in about 30 ms"
  - "A decision log for every larger change"
---

The repository has existed since 2016, but the history only goes back to January 2025, when I threw the old setup away. I had noticed that it took me minutes to find my own `repo` shell function, and that I hadn't used most of my scripts in years. So I started again, small, with chezmoi.

chezmoi keeps the source of truth in this repository and writes it into my home directory. Files named `dot_zshrc` become `~/.zshrc`, templates fill in machine-specific values, and secrets stay out of the repository; the setup expects 1Password and its SSH agent instead. Numbered `run_once_` and `run_onchange_` scripts prepare a new Mac, install everything in the Brewfile, and set up the Bun and Go tools I use. A fresh Mac needs chezmoi and a single `chezmoi init --apply` to get there.

What's in it changes more than the mechanism. Zsh is the only shell now, with startup cached so that a new terminal opens in about 30 milliseconds. Ghostty, Zed, Helix, mise, Keywink and a few of my own tools such as tdx and repot get their configuration here. A growing part is for coding agents: one shared set of development preferences and skills that Claude Code, Codex, Cursor, Pi and OpenCode all read.

The part that might be useful to others is the decision log. Every larger change, from adopting Ghostty to dropping Nushell again, is a short record with the decision, the context and the consequences, kept with vrdx. Several of them supersede earlier ones, so the log shows how the setup got to where it is. The cover shows it in vrdx's dashboard.
