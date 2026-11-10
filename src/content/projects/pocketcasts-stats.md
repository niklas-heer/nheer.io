---
title: "pocketcasts-stats"
tagline: "My Pocket Casts listening statistics, copied into Airtable every two hours."
summary: >-
  A small Python script from 2018 that logs into Pocket Casts, reads your
  listening statistics and appends the change since the last run to an Airtable table.
category: tools
status: paused
visibility: public
repo: "niklas-heer/pocketcasts-stats"
started: 2018-08-17
stack: ["Python", "pyairtable", "uv", "GitHub Actions"]
cover: "./pocketcasts-stats/cover.webp"
coverAlt: "The project's example Airtable base: listening time deltas grouped by month, calendar week and day, with sums per group"
highlights:
  - "About 150 lines of Python"
  - "Runs on a GitHub Actions schedule"
  - "Stores deltas, so you see listening per day"
---

Pocket Casts tells you how much time you have spent listening in total, and how much it saved you by skipping silence, intros and playing faster. In 2018 I wanted to know how much I listened on a given day, or last Tuesday, so I wrote a script.

It logs in with your Pocket Casts account, asks the unofficial API for the statistics summary, and writes a new row to an Airtable table, together with the difference to the previous row. Grouped by month, week and day in Airtable, those differences become a listening diary. A scheduled job runs it every two hours. If nothing changed since the last run, it writes nothing.

To use it, you copy the example base, fork the repository and add your credentials as secrets. The sync workflow skips its run if any of them are missing, so a fork without secrets stays quiet.

The project got a proper update at the end of 2025: uv instead of pip, pyairtable instead of an old wrapper, Airtable personal access tokens, tests and GitHub Actions next to the old GitLab CI setup. Since then Dependabot keeps the dependencies current and the tests still pass.

On my own copy the schedule has been off since April 2026: GitHub disables scheduled workflows in repositories without recent activity, and I never switched it back on. The listening page on this website now reads Pocket Casts directly and keeps its own history, so it took over the job. A fork starts with its own schedule. Whether the script still gets data today I haven't checked, and it relies on an unofficial API that Pocket Casts can change whenever it likes.
