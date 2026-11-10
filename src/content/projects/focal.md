---
title: "Focal"
tagline: "A calm Markdown editor for the Mac that you open from the terminal."
summary: >-
  A native macOS Markdown editor with live rendering, written in Rust on Zed's
  GPUI. You open files from the terminal, and they are saved exactly as you wrote them.
category: apps
status: active
visibility: public
repo: "niklas-heer/focal"
started: 2026-03-25
stack: ["Rust", "GPUI", "pulldown-cmark", "MathJax", "Sparkle"]
install: "brew install --cask niklas-heer/tap/focal"
cover: "./focal/cover.webp"
coverAlt: "Focal in dark mode showing a Markdown document with a heading, a tip callout, a task list, a table and a typeset integral"
gallery:
  - src: "./focal/diagrams.webp"
    alt: "A Mermaid flowchart and a Vega-Lite bar chart drawn in place inside a document"
    caption: "Diagrams draw in place, in Focal's colours"
  - src: "./focal/focus-mode.webp"
    alt: "Focus mode in light mode: only the paragraph with the caret is dark, the rest is faded"
    caption: "Focus mode"
  - src: "./focal/folder-mode.webp"
    alt: "Folder mode with a sidebar of Markdown files and a note containing a table, a callout and a small flowchart"
    caption: "Open a folder and get a sidebar and wiki links"
highlights:
  - "Saves your bytes untouched"
  - "Reloads when Git or an agent edits the file"
  - "Mermaid, Graphviz, Vega and math in place"
---

More and more of the Markdown on my disk is written by something else: a coding agent, a script, Git pulling in someone's change. I wanted a pleasant place to read and edit those files without importing them into a notes app first.

Focal is that place. You type `focal notes.md` in a terminal and get a quiet, single-column window in the iA Writer typefaces. Markdown is rendered while you write, the way Bear does it: headings look like headings, tables are tables, math is typeset. Put the caret into a word and its asterisks appear so you can edit them. Move away and they hide again.

The rule I care about most is that the file stays mine. Focal saves the bytes you typed, in their encoding and line endings, and never reformats anything. When another program changes the file, Focal reloads it, and if we both changed it, it asks which version to keep. `focal --wait` makes it usable as `$EDITOR`, and piping text into `focal` opens it as a new document.

Around that sit the comforts I wanted: tables you edit as a grid, focus mode, an outline, a word goal, wiki links and tags across a folder, export to HTML and PDF, and Vim or Helix keys for when my fingers insist. Code blocks in Mermaid, Graphviz, Vega and a handful of other diagram languages draw in place.

The first attempt in March was an Electron, React and CodeMirror app. It stalled on rendering that broke while scrolling. At the end of September I started again as a native app. After a spike with Apple's TextKit I settled on Rust and GPUI, the GPU-accelerated UI framework from the Zed editor, and that version is the one I use now. It runs on Apple Silicon Macs with macOS 14 or later, is young, and has rough edges I still find.
