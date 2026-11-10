---
title: "repot"
tagline: "Every Git repository on your machine, organised and current."
summary: >-
  A CLI that gives every checkout a predictable home, fetches them all in
  parallel, shows which need attention, updates the safe ones by fast-forward,
  and jumps to any of them with an inline fuzzy picker.
category: tools
status: active
visibility: public
repo: "niklas-heer/repot"
started: 2026-09-26
stack: ["Rust", "Ratatui", "Git", "KDL"]
install: "brew install niklas-heer/tap/repot"
cover: "./repot/cover.webp"
coverAlt: "repot status in a terminal grouping eight sample repositories into Needs review, Ready to update, Work in progress and Up to date"
gallery:
  - src: "./repot/sync.webp"
    alt: "repot sync fast-forwarding four repositories, returning a merged feature branch to main, and leaving one with local commits and one with uncommitted work alone"
    caption: "sync updates what is safe and leaves the rest"
  - src: "./repot/picker.webp"
    alt: "The inline repot cd picker listing eight repositories under the prompt, most recently used first"
    caption: "repot cd opens a picker right under the prompt"
highlights:
  - "Updates only by fast-forward"
  - "Status for every checkout in one view"
  - "Works with an existing ghq tree"
---

I have dozens of checkouts on my Mac, and several coding agents work in them at the same time. Which ones are behind? Which branch was merged last week? Where did that prototype go? repot is the tool I wrote to answer those questions without visiting each directory.

Every repository gets a home at `<root>/<host>/<owner>/<repo>`, the same layout ghq uses, so an existing ghq tree works as it is. `repot status` fetches all checkouts in parallel and groups them by what they need: ready to update, needs review, work in progress, up to date. `repot sync` then fast-forwards the clean ones and returns branches that were merged upstream to `main`, including squash and rebase merges.

The rule I care most about is that it never risks work. Updates are fast-forward only. Anything dirty or diverged is listed for review instead of touched. repot doesn't commit, stash, reset, rebase or force-push, removing a checkout archives it, and every command that changes something has `--dry-run`.

The everyday part is `repot cd`: a fuzzy picker that opens under the prompt instead of taking over the screen, ranks repositories by how often and how recently I went there, and previews the branch and recent commits on wide terminals. `repot new` starts a scratch project locally, and `repot publish` later creates the GitHub or GitLab remote and moves it into the tree. A manifest in TOML, KDL or YAML brings the same set of projects to the next machine.

repot runs on Linux and macOS, with shell integration for Bash, Zsh, Fish and Nushell. Since September 2026 it handles cloning and navigation in my own setup, with ghq still installed next to it.
