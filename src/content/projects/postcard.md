---
title: "Postcard"
tagline: "A day of travel footage, cut into a short music video."
summary: >-
  A command-line video pipeline with Claude Code as the editor: it turns one day of travel clips into a 60 to 90 second highlight cut to the beat.
category: tools
status: experimental
visibility: private
started: 2026-10-11
stack: ["Python", "ffmpeg", "librosa", "OpenTimelineIO", "Claude Code"]
cover: "./postcard/cover.webp"
coverAlt: "Postcard's local review page showing eight shots of invented abstract footage, each with Keep, Drop and Favourite controls"
gallery:
  - src: "./postcard/cli.webp"
    alt: "A terminal running postcard music list, validate, snap and check on an invented day; every check passes"
    caption: "Validating, snapping and checking a cut"
highlights:
  - "Cuts land on beats or bars"
  - "Refuses music without a licence"
  - "Checks loudness, peaks and black frames"
---

After a day of filming on a trip I have dozens of clips and no evening left to edit them. Postcard turns one day of footage into a 60 to 90 second highlight with a title and cuts that land on the beat of the music.

The work is split in two. A Python command-line tool does everything that has to be exact: it probes the clips, builds proxies, finds and measures shots, detects the beats in a track, renders and checks the result. Claude Code is the editor. It looks at contact sheets of the day, picks the moments and the music, and writes the edit as a `cut.json` file. The CLI validates that file, moves cut points onto beats or bars, renders a preview and measures it: duration, loudness, true peak, black frames and how far each cut is from the beat. Claude also looks at a sheet of the frames around every cut before showing me anything.

Then I react in plain words, like "shorter opening", or open a small local review page to keep, drop or favourite each shot. Once I approve, Postcard renders the final video, writes a YouTube description with the music credits and adds the day's best shots to an index for the whole trip. It never uploads anything.

Music is where I wanted it strict. Every track in the library records its source and licence, rendering refuses a track without one, and required credits go into the description word for word. Tracks can also be generated locally with ACE-Step.

It runs on a Mac with stock Homebrew ffmpeg, converts HDR footage to SDR, and can export timelines for Final Cut Pro and DaVinci Resolve when an edit needs a human hand.

The pictures come from a day of invented footage: generated gradients and fractals with a synthetic test-tone track.
