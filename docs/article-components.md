# Reusable article visuals

Open the local gallery at `http://127.0.0.1:4323/component-preview/` after starting
`rtk mise run preview:articles --port 4323`. The draft index links to it. It shows
working examples, mobile layouts, an intentional Mermaid error, and copyable MDX.
The gallery exists only with `PREVIEW_DRAFTS=true` or `SITE_TEST_DATA=true`; normal
live builds omit it. All gallery measurements are explicitly illustrative.

Import components in MDX. Paths below assume a post under `src/content/posts/2026/`.
Each figure needs a unique, page-local `id`, a meaningful `title`, and a `caption`
that states the evidence, scope, and relevant limits. `label` is an optional eyebrow.
Invite the reader before the visual and interpret the result afterward. Distribute
figures where they answer questions throughout the article, including later sections.

## Choose a component

| Reader question | Component | Behavior |
| --- | --- | --- |
| What happens in order? | `ArticleFlow` | HTML steps and connectors; stacks on mobile; no JavaScript |
| What branches, relates, or communicates? | `MermaidDiagram` | Mermaid source becomes SVG; lazy renderer, expand/fit, source disclosure |
| What are the headline measurements? | `ArticleMetrics` | Responsive number cards with units, context, optional labeled change |
| How do measured values compare? | `ArticleComparison` | Horizontal bars on one zero-based scale, explicit units and unknowns |
| Does the explanation need a custom illustration? | `ArticleFigure` | Existing accessible frame around HTML, SVG, or image content |

All components share `ArticleFigure`'s dark surface in both site themes. Figures
use text labels rather than color alone, and avoid automatic animation. Flows,
cards, and comparisons are static HTML/CSS; only Mermaid needs a browser renderer.

## Mermaid

```mdx
import MermaidDiagram from '../../../components/MermaidDiagram.astro';

<MermaidDiagram
  id="review-flow"
  title="Where does the judgment go?"
  description="Evidence goes to a reviewer. Supported claims become notes; uncertain claims return for investigation."
  caption="An explanatory workflow, not a live system."
  code={`flowchart TD
    A[Evidence] --> B{Supported?}
    B -->|Yes| C[Record the note]
    B -->|Unclear| D[Investigate]
    D --> A`}
/>
```

`description` is required: explain the relationships in ordinary language, so
readers have more than diagram syntax if the renderer is unavailable. Flowcharts
and sequence diagrams are exercised in the gallery; other standard Mermaid
syntax can use the same `code` prop, but verify the actual diagram before shipping.
Plain fenced `mermaid` blocks are **not** automatically converted. Use this component
to supply the title, description, controls, and consistent figure treatment.

The npm dependency is bundled locally, with no CDN renderer or rendering service.
It is dynamically imported when a diagram approaches the viewport. The custom
element also initializes after Astro client navigation. The renderer uses strict
security mode, no HTML labels, a fixed dark palette, and unique SVG IDs. Source is
author-controlled content, not arbitrary visitor input. Prefer concise labels;
split complicated graphs instead of making the article depend on zooming.

Readers can expand the diagram to at least 640px and scroll its own viewport, or
fit it back to the article. Source uses native `details`; controls are disabled
until the SVG exists. Without JavaScript, the description and source remain readable.
A parse/load failure opens the source and shows a readable status instead of
leaving a broken diagram or throwing an unhandled page error. Rendering is a
browser operation: the build alone does not validate Mermaid syntax.

Implementation reference, verified 2026-09-19 against Mermaid 12:
[render API and strict mode](https://mermaid.js.org/config/usage.html),
[theme configuration](https://mermaid.js.org/config/theming.html), and
[accessible diagrams](https://mermaid.js.org/config/accessibility.html).

## Metric cards

```mdx
import ArticleMetrics from '../../../components/ArticleMetrics.astro';

<ArticleMetrics
  id="request-summary" title="A result needs context."
  caption="Illustrative numbers only. Compare the same workload and measurement method."
  metrics={[
    { label: 'Median latency', value: 90, unit: 'ms',
      change: { text: '62.5% lower than 240 ms', tone: 'positive' },
      detail: 'Include the sample size and measurement conditions here.' },
    { label: 'Observed errors', value: 0 },
    { label: 'Production latency', value: null, detail: 'Not yet tested.' }
  ]}
/>
```

`value` accepts a finite number, a formatted string, or `null` (displayed as
“Not measured”). Zero remains zero. `unit`, `detail`, and `change` are optional.
Changes are authored text, not computed or fetched. `change.tone` can be `positive`,
`negative`, or `neutral`; explain the direction in words and include the baseline.
Use a few headline numbers, and cite their source in surrounding prose. Never turn
a model confidence score into measured accuracy or hide unassessed cases.

## Bar comparisons

```mdx
import ArticleComparison from '../../../components/ArticleComparison.astro';

<ArticleComparison
  id="latency-comparison" title="Same workload, two approaches."
  unit="ms"
  caption="Illustrative values, not a project benchmark. Lower would be faster."
  items={[
    { label: 'Baseline', value: 240 },
    { label: 'Revised approach', value: 90 },
    { label: 'Production run', value: null }
  ]}
/>
```

Values must be finite and nonnegative or `null`. The shared scale begins at zero
and ends at the largest value (1 for an all-zero/unknown sample). Optional `max`
can fix the same domain across multiple figures; it must include every value.
Zero-length bars stay empty. Unknowns say “Not measured.” Use another chart for
signed values, distributions, uncertainty intervals, or time series; do not force
those into headline cards or an unsuitable bar chart.

## Process diagrams and custom figures

```mdx
import ArticleFlow from '../../../components/ArticleFlow.astro';
import ArticleFigure from '../../../components/ArticleFigure.astro';

<ArticleFlow
  id="writing-process" title="From source to story."
  caption="A simplified sequence; review can lead to another revision."
  steps={[
    { label: 'Gather', title: 'Read the evidence', detail: 'Find a concrete change.' },
    { label: 'Explain', title: 'Draft the story', detail: 'Introduce the reader to the problem.' },
    { label: 'Review', title: 'Check the result', detail: 'Verify the claims and the rendered article.' }
  ]}
/>

<ArticleFigure id="custom-diagram" label="Mechanism" title="A custom illustration" caption="Explain the source and meaning here.">
  <svg viewBox="0 0 300 80" role="img" aria-label="An input connects to an output">
    <path d="M80 40H220" stroke="#8ae0c6" stroke-width="2" />
    <circle cx="60" cy="40" r="20" fill="#c6adff" />
    <circle cx="240" cy="40" r="20" fill="#8ae0c6" />
  </svg>
</ArticleFigure>
```

Flow steps require `title` and `detail`; `label` is optional. Up to three steps
are horizontal on desktop; longer sequences and mobile layouts stack vertically.
For custom figures, keep styles in the owning component, provide an accessible
text equivalent, and use a real image/recording when showing working software.

## Checks and authoring decisions

Added 2026-09-19 at Niklas's request for reusable diagrams, Mermaid, and dashboard
numbers. Reuse the existing Astro figure frame rather than a second design system.
Mermaid is the one added renderer dependency; numeric and simple process components
need no chart library. Client rendering avoids requiring a browser in the production
build, at the cost of a lazy client download and a textual rather than graphical
no-JavaScript fallback. This is a component integration, not a Markdown compiler
extension. Revisit only if automatic fenced-block support or pre-rendered SVGs are needed.

`tests/article-components.spec.ts` runs against the sample-data build. It checks
two diagrams on one page, keyboard expansion, confined mobile scrolling, source
disclosure, error fallback, client navigation, no-JavaScript reading, zero/unknown
values, proportional bars, and no renderer request on pages without diagrams.
Run `rtk mise run check`; inspect the gallery and any article that uses these
components on desktop and mobile. Normal production builds must omit the gallery.

Verification on 2026-09-19: sample-data build, 18 pipeline tests, 30 unit tests,
and 31 browser tests passed. After adding a renderer-download failure case, all
five component browser tests passed again. The gallery and Jev draft were visually
inspected at 1280px and 390px with no page errors or horizontal overflow; the gallery
was opened in Arc. The final npm audit step remained unavailable (HTTP 503,
registry maintenance), including a separate retry; no clean audit is claimed.
