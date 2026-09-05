# Article dates and evidence

Drafts prepared September 5, 2026. At the author's request, the display dates follow
project milestones rather than today's drafting date. Claims and examples are scoped
to the referenced revision; these dates do not represent independent evidence of
when the articles were originally written or published.

| Draft | Display date | Basis |
|---|---|---|
| The fastest language, with an asterisk | 2026-02-10 | Day after the February 9 benchmark contributions, including Swift accumulators in commit `8917f3cdf761` |
| The hard part of a Markdown todo app is saving the file | 2026-07-17 | Day after tdx v0.13.1; versioned README confirms conflict handling and snapshot history |
| Teaching architecture diagrams to explain themselves | 2026-07-19 | Sceno v0.4.0; excludes the September live-preview/verified-repair UI |
| How much Python does a little CLI need? | 2026-08-06 | Day after Kipferl v0.6.0; excludes September project-workflow additions |
| A shell with two kinds of pipes | 2026-08-23 | Day after Quirl v0.1.0; excludes later repository finder, explorers and conversational assistant |
| I gave a classroom projector a racing career | 2026-09-04 | First playable version and driving-polish commits on September 4, through `9edd2c224140` |

Each article links its source revision or release. Visuals are hand-authored explanatory
SVGs with keyboard-operable controls; benchmark numbers are explicitly illustrative.
The drafts avoid unverified benchmark improvements and invented development anecdotes.

Preview with `npm run preview:articles -- --port 4323`, then open `/drafts/`.
The normal build and RSS exclude these drafts. Publishing also rejects any build
created with draft previews or sample podcast data.
