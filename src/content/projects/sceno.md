---
title: "Sceno"
tagline: "Architecture diagrams as text you can diff and validate."
summary: >-
  Declarative architecture diagrams in KDL. One readable file becomes SVG, PNG,
  PDF, HTML or slides, and validation reports overlaps and crowded labels before
  anyone looks at the picture.
category: tools
status: active
visibility: public
repo: "niklas-heer/sceno"
started: 2026-06-05
stack: ["Go", "KDL", "SVG"]
install: "brew install niklas-heer/tap/sceno"
cover: "./sceno/cover.webp"
coverAlt: "The Sceno live preview in a browser: a Garden app architecture diagram on the canvas and a visual health score of 98 out of 100 with one layout suggestion in the side panel"
gallery:
  - src: "./sceno/source.webp"
    alt: "A terminal showing the KDL source of the Garden app diagram, with shapes, icons, grid positions and labelled edges, followed by sceno validate reporting ok"
    caption: "The diagram is a KDL file"
  - src: "./sceno/render.webp"
    alt: "The rendered Garden app diagram: Gardener, API gateway, Garden service and Plant catalogue in a row, with Forecast cache, Reminder queue and Push sender below"
    caption: "The same file rendered to PNG"
posts:
  - "/posts/2026/07/2026-07-19_diagrams-that-explain-themselves/"
highlights:
  - "One KDL file, many export formats"
  - "Validation with fix hints, as text or JSON"
  - "Live preview with reviewed geometry repairs"
---

Architecture diagrams tend to go stale quietly. Someone adds a service, the picture in the slide deck stays the same, and a few months later nobody trusts it.

Sceno treats the diagram as a document. You write it in KDL, a text format that is comfortable with nested things: `shape box api "API gateway"`, `edge client -> gateway label="HTTPS"`. The file goes into Git like code, so a change to the architecture shows up as a diff in review instead of as a new screenshot.

Because the source is text, Sceno can check it. `sceno validate` reports structural problems with a suggested fix, `sceno advise` scores the layout and points at crowded labels and awkward arrows, and `sceno describe` prints the computed scene, including a small ASCII map. All of them speak JSON. That was the other half of the idea: an AI agent can edit a diagram, read the findings and try again without ever opening an image. The documentation for agents is generated from the code, so it describes the version you have installed.

For people there is `sceno preview`, a local browser view that redraws on save, lets you click a shape to inspect its bounds and source line, and offers repairs for some geometry problems, each shown as a diff before you apply it. Templates for service architectures, deployment pipelines, request flows and short presentations get a new diagram started, and one file can export to SVG, PNG, PDF, HTML and slide decks.

Sceno is a single Go binary for macOS and Linux and runs entirely on your own machine.
