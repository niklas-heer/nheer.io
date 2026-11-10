---
title: "Mailboard"
tagline: "Keyboard-first Gmail triage, with a Kanban board for what remains."
summary: >-
  A local-first desktop prototype for getting through Gmail with the keyboard and sorting the mail that needs work onto Kanban boards.
category: apps
status: experimental
visibility: private
started: 2026-10-02
stack: ["Rust", "GPUI Kit", "SQLite", "OpenCode"]
cover: "./mailboard/cover.webp"
coverAlt: "Diagram of Mailboard: Gmail syncs through the Workspace CLI into a local SQLite copy, which a native window shows as a keyboard-driven list and a five-column board"
highlights:
  - "Archive, trash and undo from the keyboard"
  - "Actions wait locally until you sync"
  - "Optional column suggestions from a model"
---

Mailboard is an experiment in getting through email faster: a native desktop app where I go through Gmail with the keyboard, and anything that needs more than a moment goes onto a board.

The list view shows conversations on the left and the selected one on the right. The arrow keys move through them, E archives, D moves to the trash, and ⌘Z takes back the last of those. Each board has five columns: Review, Urgent, Doing, Waiting and Done. The same conversation can sit in different columns on different boards, and archiving the mail leaves its card where it is.

It is local-first. Mail is cached in SQLite, and every action changes the local copy at once and joins a queue. Gmail only hears about it when I press "Sync actions", which goes through Google's Workspace command-line tool. Nothing is fetched in the background either: Refresh imports one page of the inbox. Each Gmail account gets its own database, and a database refuses to sync with a different account.

There is an optional model step. Through a local OpenCode server, a model I choose can suggest a column for a conversation. It sees the conversation, the preferences I wrote down and my recent confirmed decisions. I accept or correct each suggestion, and nothing is moved or archived on its own.

The app is written in Rust with GPUI Kit, and its tests drive the interface headlessly with invented mail. I built it in a day and it is a prototype: there is no composing, no HTML rendering and no incremental sync yet. A demo workspace with invented conversations runs without a Gmail account.

The picture is a diagram of how the pieces fit together, with invented mail in place of a real inbox.
