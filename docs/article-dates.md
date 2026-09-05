# Article dates and evidence

Articles prepared and published September 5, 2026. At the author's request, the display dates follow
project milestones rather than today's drafting date. Claims and examples are scoped
to the referenced revision; these dates do not represent independent evidence of
when the articles were originally written or published.

| Article | Display date | Basis |
|---|---|---|
| The slowest part of my speed comparison | 2026-02-10 | Repository snapshot `8917f3cdf761`: Arch migration (2018), Earthly (2022), Nix/Devbox and Dagger work (December 2025), and February 2026 target maintenance |
| My todo list lives in the repository | 2026-07-17 | Day after tdx v0.13.1; versioned README confirms conflict handling and snapshot history |
| Teaching architecture diagrams to explain themselves | 2026-07-19 | Sceno v0.4.0; excludes the September live-preview/verified-repair UI |
| Python-shaped code. A 1.47 MB executable. | 2026-08-06 | Day after Kipferl v0.6.0; excludes September project-workflow additions |
| I wanted a shell that could keep my old habits | 2026-08-23 | Day after Quirl v0.1.0; excludes later repository finder, explorers and conversational assistant |
| The projector racing game I never got around to making | 2026-09-04 | First playable version and driving-polish commits on September 4, through `9edd2c224140` |

The September 5 editorial revision incorporates the author's own motivations and
memories. Fresh terminal recordings use the released Kipferl 0.6.0 builder,
Homebrew tdx 0.13.1, and a Quirl 0.1-line development artifact. The two game screenshots come from
commit `9edd2c224140`; Sceno's real exported figure comes from v0.4.0. Recordings
were made for the articles, not on their historical display dates. Sources and
reproduction instructions are in `scripts/article-demos/README.md`.

The six articles are public posts. The homepage shows the latest three; `/posts/`
and RSS include all six. Browser tests exercise the production routes and verify
these discovery paths. `/drafts/` remains a local-only preview for future drafts.
Publishing through the homelab pipeline rejects builds made with draft previews
or sample podcast data.
