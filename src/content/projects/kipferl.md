---
title: "Kipferl"
tagline: "Write Python-style code, hand someone one small executable."
summary: >-
  A toolkit for small command-line apps: write Python-style code with built-in
  boxes, tables and prompts, then build a single native executable that needs no
  Python on the other machine.
category: tools
status: active
visibility: public
featured: 6
repo: "niklas-heer/kipferl"
homepage: "https://kipferl.dev"
docs: "https://kipferl.dev/docs"
started: 2025-12-16
stack: ["Rust", "PocketPy", "Python"]
install: "brew install niklas-heer/tap/kipferl"
cover: "./kipferl/cover.webp"
coverAlt: "A terminal showing a ten-line status.py that uses Kipferl's tui module, then the built ./status executable printing a titled box, a service table and a success line"
gallery:
  - src: "./kipferl/build.webp"
    alt: "kipferl build output: core runtime profile, tree-shaken, loader selected, and a standalone binary of 1450 KB for macOS on Apple Silicon"
    caption: "One build, one file of about 1.4 MB"
  - src: "./kipferl/website.webp"
    alt: "The kipferl.dev landing page in dark mode with the headline From Python script to shipped tool and the Homebrew install command"
    caption: "kipferl.dev"
posts:
  - "/posts/2026/08/2026-08-06_small-python-cli/"
  - "/posts/2026/09/2026-09-20_the-compiler-can-yell-at-somebody-else/"
highlights:
  - "One executable, no Python install needed"
  - "Boxes, tables and prompts built in"
  - "PyPI packages checked before they ship"
---

Python is the language I get small things done in fastest. Handing one of those small things to somebody else is where it stops being small: they need the right Python, a virtual environment, and a short lecture about `pip`.

Kipferl is my answer for command-line tools. You write Python-style code, and `kipferl build` turns it into one executable for macOS or Linux, on ARM64 or x86_64. The status app in the picture builds to about 1.4 MB. Whoever runs it needs neither Kipferl nor Python.

It gets there by not being CPython. Kipferl embeds PocketPy, a small Python implementation, in a Rust host, and adds a curated set of modules aimed at CLIs: boxes, tables, prompts and progress output. At build time it looks at what your program imports and picks a trimmed runtime profile when it can, or the full one when it must. That trade-off is the whole point. You get a focused way to write tools, and not every package on PyPI will work.

For the packages that do, there is a checked path. `kipferl add` resolves pure-Python wheels, checks their source with the embedded runtime, and records exact versions and hashes in a lock file. Unknown packages stay marked as unverified until you decide otherwise. Projects start from templates, `kipferl dev` restarts the app while you edit, and `kipferl test` runs the tests.

The project started in December 2025 as μcharm, with a Zig host. Since then it has swapped its embedded Python runtime once and its host language once, from Zig to Rust, while the Python-facing side stayed the same. The website has the documentation, a compatibility guide for packages, and release notes with dated measurements.
