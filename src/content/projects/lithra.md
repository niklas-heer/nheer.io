---
title: "Lithra"
tagline: "Reproducible systems and images, described in a language you can read."
summary: >-
  An early experiment in keeping what makes Nix great, a content-addressed store
  and rollbacks, while describing packages in typed Starlark and systems and
  images in plain TOML.
category: tools
status: experimental
visibility: public
repo: "niklas-heer/lithra"
started: 2026-09-24
stack: ["Rust", "Starlark", "TOML"]
cover: "./lithra/cover.webp"
coverAlt: "Diagram of Lithra's plan: a TOML description feeds typed Starlark package definitions and a Rust CLI, which produce a content-addressed store with rollbacks and minimal OCI images with an SBOM, marked as an experiment"
highlights:
  - "Typed Starlark for package definitions"
  - "TOML for describing machines and images"
  - "OCI images with an SBOM and provenance"
---

Nix gets a lot right: a content-addressed store, generations you can roll back atomically, and one description that produces the same machine or container image every time. It is also hard to use, mostly because of the language you describe everything in.

Lithra is an experiment in keeping the first part and changing the second. Package definitions would be written in typed Starlark, the Python-like configuration language Bazel uses. It is deterministic, can be evaluated in parallel, and only loads the packages you actually ask for, so an override is just a function argument. People who only want a system or an image would describe it in TOML: a list of what they want, without learning a build language. The tooling is Rust, with errors that point at your code. Container images should come out minimal, with an SBOM and provenance attached.

To be clear about where it stands: nothing works yet. The repository has a Rust crate, the CI pipeline and the plan. The first milestone is small and measurable: evaluate a Starlark package definition into a build plan and compare its speed with `nix eval`.

The picture above is a diagram of the plan, since there is nothing to take a screenshot of yet. The TOML in it only sketches the intended shape.
