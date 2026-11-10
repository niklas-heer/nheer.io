---
title: "Quirl"
tagline: "A shell that keeps your Bash habits and adds typed data."
summary: >-
  An interactive shell in Rust: familiar Bash and Zsh commands, an explicit data
  mode with Nushell-style pipelines over JSON, CSV and files, and one sandboxed
  Lua runtime for configuration and plugins.
category: tools
status: active
visibility: public
featured: 3
repo: "niklas-heer/quirl"
homepage: "https://quirl.dev"
docs: "https://quirl.dev/docs"
started: 2026-08-15
stack: ["Rust", "Lua", "reedline"]
install: "brew install niklas-heer/tap/quirl"
cover: "./quirl/cover.webp"
coverAlt: "A Quirl session: source .env and a pasted for-loop, a byte pipeline with wc, then a JSON file filtered and sorted into a colored table in data mode"
gallery:
  - src: "./quirl/data-and-lua.webp"
    alt: "Quirl in data mode grouping services by region, averaging latency with math avg, and evaluating a Lua expression that returns answer 42 and Lua 5.5"
    caption: "group-by, math and a Lua expression in the same session"
  - src: "./quirl/website.webp"
    alt: "The quirl.dev landing page with the headline Your shell, with a richer vocabulary"
    caption: "quirl.dev"
posts:
  - "/posts/2026/08/2026-08-23_shell-two-pipelines/"
highlights:
  - "Pasted Bash loops run as they are"
  - "Data mode with where, sort-by and group-by"
  - "One sandboxed Lua runtime for extensions"
---

I liked working with data in Nushell a lot. Then I copied a command from my notes, and it didn't run, because it assumed the usual shell syntax. The same happened with commands from the internet and from AI tools. I kept switching back to another shell just to paste things.

Quirl is my attempt to have both. You start in normal mode, where quoting, pipes, redirects, jobs, loops, functions and aliases behave the way your fingers expect. A pasted `for` loop runs, and so does `source .env`. Over SSH and for editors and agents, `quirl -c` gives exact POSIX `sh` behaviour, so it is safe as a login shell. Syntax that only one shell understands gets an explicit `bash { ... }` or `zsh { ... }` block.

Type `mode data` and the same session speaks Nushell's vocabulary: `open services.json | where latency > 50 | sort-by latency -r` gives you a typed table instead of columns of text to count. `group-by`, `select` and `math` work on JSON, YAML, TOML, CSV and directory listings. `mode normal` takes you back.

For scripting I wanted a real language instead of a configuration format that grew loops. Quirl embeds Lua with resource limits, and the same runtime drives configuration, prompt segments, completion providers and plugins. Completion asks your installed Zsh and tools like `git` or `kubectl` for candidates, and one catalogue of command knowledge feeds completion, the F1 help, the documentation and the language server.

Quirl is German for a wooden whisk. It is young and moves fast, with releases for Linux and macOS through Homebrew, checksummed archives and a Nix flake.
