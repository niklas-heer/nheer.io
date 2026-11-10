---
title: "Speed comparison"
tagline: "One π calculation, many implementations, and the evidence behind each timing."
summary: >-
  An open microbenchmark that runs the Leibniz approximation of π in dozens of
  languages and compiler settings, and publishes the source, toolchain and raw samples behind each result.
category: web
status: active
visibility: public
featured: 2
repo: "niklas-heer/speed-comparison"
homepage: "https://speed-comparison.vercel.app/"
docs: "https://speed-comparison.vercel.app/methodology/"
started: 2018-02-17
stack: ["Python", "Dagger", "Nix", "Devbox", "Hyperfine", "Astro"]
cover: "./speed-comparison/cover.webp"
coverAlt: "The speed comparison website in dark mode: the Leibniz formula for π and a small log-scale chart comparing Rust, C, Go, Java and Python"
gallery:
  - src: "./speed-comparison/results.webp"
    alt: "The results table listing implementations with compiler version, math behaviour label and median time"
    caption: "Every row opens its samples, build commands and packages"
  - src: "./speed-comparison/methodology.webp"
    alt: "The methodology page, headed 'The conditions are part of the result'"
    caption: "The methodology page"
posts:
  - "/posts/2026/02/2026-02-10_what-a-benchmark-measures/"
  - "/posts/2026/09/2026-09-20_the-compiler-can-yell-at-somebody-else/"
highlights:
  - "The same Leibniz loop in every implementation"
  - "Source, toolchain and raw samples for each run"
  - "Toolchains pinned with Nix through Devbox"
---

In 2018 I read a blog post by Thomas Christlieb that compared a few programming languages on one small calculation, and I wanted the languages he had left out. So I recreated it in a repository, and other people kept adding their favourites.

The calculation is the Leibniz series for π: four times one minus a third plus a fifth minus a seventh, and so on, a billion terms per run. It converges slowly, which makes it a terrible way to compute π and a decent repeatable workload for loops and floating-point arithmetic. Every implementation computes the same series, single-threaded. Variants that use SIMD or relaxed floating-point math get their own entries and labels, so a fast number can't hide how it was made.

The chart is what people come for. What I have spent most of my time on is getting dozens of compilers and interpreters installed in a way I can repeat. That went from one big Arch Linux container, to an Earthly target per language, to Nix packages through Devbox driven by Dagger. Today each language is declared once, the toolchain versions are pinned, and every published run keeps the source, commands, environment and individual measurements next to the timing.

The website is an Astro build over those published snapshots. You can sort and filter the results, open any implementation to see its samples and build commands, read the methodology, and go back through the archive of older runs.

I try to be clear about what it is. It compares specific implementations on one numerical microbenchmark. It says nothing about web servers, databases or whole applications, and a few milliseconds between neighbours can be noise. Contributions of new languages and faster versions are welcome, as long as the experiment stays visible.
