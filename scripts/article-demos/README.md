# Real application recordings for the project articles

Captured September 5, 2026. The article display dates follow project milestones;
they are not recording timestamps. The tapes run real programs against local
sample files. No production services, user task files, or credentials are used.
Videos have no audio, do not autoplay, and use native playback controls. Adjacent
article text explains the commands and results.

## Artifact provenance

- Kipferl: released `v0.6.0`, `kipferl-macos-aarch64`, verified against its adjacent
  release checksum. SHA-256 `f028d1522147a0e1999dec1da0d9983094a00217a4f713c52c6669388810ebba`.
- tdx: Homebrew `v0.13.1`, Apple Silicon executable, 9,661,858 bytes.
  SHA-256 `51892a025d4359ad89a22d55867b6e1cc29b9051b62a276cb819ccc82c8e026d`.
- Quirl: the project's locally built 0.1-line development artifact, terminal
  build label `dev@1787757512+9b3e8fa*`. It is not presented as the immutable
  v0.1.0 release. SHA-256
  `75f108bb5f3f2cbdc18c7f4be595fb2d64719997d11fc692bf7b653ec2a0f4c9`.
  Its core Normal/Data/Lua demonstration matches the article's scope; the
  recording does not show later AI or project-discovery features.
- Projector screenshots: extracted unchanged from `9edd2c224140` in
  `niklas-heer/overhead-overdrive`, `docs/screenshots/race.png` and
  `docs/screenshots/courtyard-menu.png`.
- Sceno export: extracted unchanged from `v0.4.0`, `docs/how-it-works.png`;
  corresponding source is `examples/how-it-works.kdl`.

## Reproduce the recordings

Run from the website repository. Requires VHS, ttyd, ffmpeg, the JetBrainsMono
Nerd Font, and the application binaries above. The Quirl tape invokes the
sibling repository's `scripts/demo-session.sh`, which supplies isolated sample
data, configuration, history, and cache directories. Its binary path points to
that repository's `target/release/quirl`; verify the digest before reproducing
an identical recording.

The Kipferl tape expects a verified executable named `kipferl` in
`/tmp/nheer-article-media/kipferl`. Copy `kipferl-status.py` there as `status.py`.
The tdx tape expects `/tmp/nheer-article-media/tdx/README.md`, initialized from
`tdx-readme.md`, in a disposable Git repository with an initial commit. Reset
that disposable README from the fixture before every recording. tdx uses a
separate `XDG_CONFIG_HOME` in the same temporary directory.

```sh
vhs scripts/article-demos/kipferl.tape
vhs scripts/article-demos/tdx.tape
vhs scripts/article-demos/quirl.tape
```

Posters are actual frames from the MP4 files. Extract with ffmpeg using `-ss 16`
for Kipferl, `-ss 8` for tdx, and `-ss 17` for Quirl, followed by `-frames:v 1`.
The public filenames are declared in the tapes; posters use the same basename
plus `-poster.png`.

## Size measurement

Build the included status program with the released Kipferl builder:

```sh
kipferl build status.py -o status
kipferl build status.py -o status-full --full-runtime
stat -f '%N: %z bytes' status status-full
```

Measured on macOS ARM64: **1,467,617 bytes** (core), **4,834,705 bytes** (full).
Reduction: **69.6%**. Decimal MB, not MiB. These are output executables, not
builder downloads or compressed archives. The small program includes `tui.box`,
`tui.table`, and `tui.success`; it is not an empty binary. The separate minimal
release-note baseline is 1,450,837 bytes and should not be confused with this
slightly larger example. No startup benchmark was performed for these articles.
