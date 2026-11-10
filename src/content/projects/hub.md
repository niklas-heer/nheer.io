---
title: "hub"
tagline: "The repository I open before choosing a repository."
summary: >-
  A private home base for my coding agent: it looks across my other projects, keeps research, facts and decisions apart, and holds small tools for cross-repository chores.
category: infrastructure
status: active
visibility: private
started: 2026-09-19
stack: ["Rust", "Markdown", "mise", "Dagger"]
cover: "./hub/cover.webp"
coverAlt: "Diagram of the hub: questions on the left, the hub with its research, facts, decisions and scratch folders in the middle, and placeholder repositories on the right"
gallery:
  - src: "./hub/repo-status.webp"
    alt: "A terminal running repo-status and repo-status sync on six invented repositories; the two that were behind are fast-forwarded"
    caption: "The checkout status report on invented repositories"
posts:
  - "/posts/2026/09/2026-09-19_the-repository-between-my-repositories/"
  - "/posts/2026/09/2026-09-19_small-questions-with-jev/"
highlights:
  - "Research, facts and decisions kept apart"
  - "Small Rust tools for cross-repo chores"
  - "Looks across every local checkout"
---

I have a lot of repositories, and some questions come before picking one of them. What needs my attention? How far did I get with that idea? Should this new thing be its own project? The hub is a private repository I open in my coding agent to ask those questions.

From there the agent can look across my local checkouts and GitHub and turn issues, pull requests and unfinished work into a short list with evidence. It can investigate an idea before it has a home, or help start a new project: check what I already have, settle the scope, find a name and create the repository. Once the real work begins, it moves to that project's checkout and follows that project's instructions.

What comes out of this work goes into plain files with different jobs. `research/` holds investigations, `facts/` holds findings with their scope and the date they were last verified, and `decisions/` records what I chose and why. Keeping them apart stops an option I once considered from quietly turning into a decision.

Over time it collected small Rust tools for chores that span repositories: a status report that shows which checkouts are ahead, behind or dirty and fast-forwards the clean ones, an audit of tool versions across projects, a screen for project names, and a cleanup for build output. Agent skills in the repository wrap them into workflows, and a capture step saves reusable findings during normal work instead of at the end.

It needs tending. Notes go stale, and an overview is only as good as the evidence behind it. I'd still rather maintain that than rebuild the context every time.

The cover is a diagram. The terminal picture shows the status report on a handful of invented repositories.
