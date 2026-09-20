# Homelab article evidence

Draft prepared September 7, 2026 from the sibling `homelab` checkout. This was a
read-only editorial review of repository files, not a new live infrastructure
audit. First-person framing is proposed copy for Niklas's review. The author
requested a combination of a personal tour and a technical deep dive, and supplied
the motivation: more sovereignty, inspiration from a recurring day encouraging
switches away from US services toward European alternatives, and wanting an AI
family plan he could manage for his parents. No family usage anecdote has been
invented. On September 8, 2026, the author approved removing draft status.
The post is now `draft: false`, keeping its September 7 article date. This
status change makes it part of the normal site build; it does not itself deploy
the site.

The second editorial revision follows the author's request for a shorter tour,
an architecture diagram, and more emphasis on declarative management, Talos's
small component set and API updates, INWX/KDL, NixOS, NetBird, SSO, and project
workloads. The article now uses MDX to embed the responsive, static
`HomelabArchitecture.astro` component. The architecture figure is a simplified
map of responsibilities and web access, not a full packet-level network diagram.

Digital Independence Day appears to match the remembered initiative. Its official
site confirms the first Sunday of each month, but the author has not yet confirmed
the name. The article describes the remembered idea and links DID as a matching
example without definitively identifying the remembered campaign. The family-plan
passage describes the author's unmet need, not an exhaustive current market claim.

| Article material | Source in the homelab repository |
| --- | --- |
| Intended users, goals, provider choice, current topology, application scope | `plan.md`, especially sections 1, 4, and 5; `Pulumi.prod.yaml` confirms three control-plane and four worker names |
| Control-plane separation motivation | `plan.md`, “Why split control plane and workers” |
| Family chat tasks, German handbook, sharing | `docs/open-webui/family-handbook-de.md` |
| Model labels, LiteLLM, Eden AI and OpenRouter fallback | `cluster/infra/litellm/values.yaml` |
| Speech support | `cluster/infra/open-webui/resources/whisper-stt.yaml`; `plan.md` current app scope includes Kokoro TTS |
| Routing, private admin path, utility-host implementation | `infra/src/homelab_infra/renderers.py`, `infra/nixos/utility-host/configuration.nix`, `docs/README.md` |
| Infrastructure/GitOps boundary, task entrypoints, secrets, CI and updates | `AGENTS.md`, `README.md`, `docs/ci-validation.md` |
| Python maintenance rationale | `docs/pulumi-language-choice.md` |
| Shared database topology and role cap | `cluster/infra/homelab-postgres/30-cluster.yaml` |
| Connection exhaustion, observed usage and repair | `docs/incident-2026-09-04.md` |
| Isolated restore evidence, first-attempt failure and limitations | `docs/restore-drill-2026-09-05.md` |
| Failed backup schedules, replacement backups, two daily opportunities, unresolved capacity issue, preview concurrency | `docs/incident-2026-09-07.md` |
| Monitoring components and dashboard generation | `docs/observability-stack.md`, `AGENTS.md` alerting conventions |
| WAL/storage monitoring distinction | `docs/postgres-runbook.md`, `cluster/infra/homelab-postgres/30-cluster.yaml` |
| KDL zone syntax, conservative plan/apply, resolver and delegation checks | `infra/dns/heer.family.kdl`, `infra/src/homelab_infra/dns.py`, `infra/src/homelab_infra/dns_sync.py`, `tasks.py` DNS collection, `docs/dns-migration-checklist.md` |
| Native OIDC for Open WebUI, TREK, AFFiNE and admin tools | `infra/src/homelab_infra/components/authentik_*_oidc.py`, `cluster/apps/trek/values.yaml` |
| Website checks; public site stays on Netlify; schedule remains in check mode | `docs/nheer-workflows.md`, `cluster/apps/nheer/schedule.yaml` |
| Benchmark workflow, selected worker, suspended benchmark schedule and daily archive imports | `docs/speed-comparison.md` |

The KDL snippet uses `example.org` and the documentation address `192.0.2.10`.
It preserves the actual parser's syntax but is explicitly an illustrative subset,
not a complete zone to apply. The DNS sync tasks are separate from Pulumi. No live
DNS plan or apply was run during article work.

Current configuration takes precedence over historical summaries. In particular,
the architecture summary still mentions a three-node cluster and the PostgreSQL
runbook retains an old control-plane placement description. Neither is used in
the article. The operator handbook's short list of public endpoints omits newer
application routes present in the renderer, so the article avoids an exhaustive
public endpoint count.

External primary references checked for the linked product descriptions:

- https://www.siderolabs.com/talos-linux
- https://argo-cd.readthedocs.io/en/stable/
- https://di.day/en
- https://netbird.io/press (Berlin headquarters and open-source platform)
- https://www.edenai.co/about (Lyon, France headquarters; gateway to model providers)
- https://www.hetzner.com/legal/legal-notice/ (Gunzenhausen, Germany)
- https://www.inwx.de/en/aboutus/imprint (INWX GmbH, Berlin, Germany; the `.com`
  imprint instead identifies its Swiss entity, so the German source is used)
- https://netbird.io/knowledge-hub/netbird-agpl-announcement (BSD-3 client/root,
  AGPL server components and dashboard, and self-hosting)

The article does not claim local LLM inference, verified regional residency for
all provider requests, full disaster-recovery timing, current live availability,
completed control-plane resizing, or fully automatic site publishing. No total
monthly cost was inferred from instance types. Detailed restore timing and row
counts from the first draft were removed to keep the revision concise. NetBird is
described through its open-source client and core server components rather than
claiming every commercial feature is open source. The current setup uses NetBird
Cloud management; self-hosting is an option, not a claim about this deployment.

The provider table added at the author's request identifies the four named
companies' bases: all in the EU and three in Germany. It does not make an
all-dependencies or all-processing EU residency claim. “Network” in the author's
message is interpreted as NetBird from the preceding discussion. The author's
Hetzner stack specifies `fsn1` for both compute and object storage. No inference
request or external provider configuration was changed during this edit.

The reader-experience revision brings the family use case before the provider
table, guides readers through the existing architecture figure, and expands the
NixOS utility-host section. Its service settings are selected verbatim from
`infra/nixos/utility-host/homelab-utility-host.nix` (with the equivalent single
SSH option flattened for the short excerpt). The snippet is explicitly partial.
The flake, lock file, Disko configuration and alerting module live under
`infra/nixos/`; Python generation is in `infra/src/homelab_infra/renderers.py`.
`utility_install` and `utility_apply` in `tasks.py` establish the install versus
subsequent remote rebuild lifecycle. The Caddy module enables the INWX plugin
and DNS-01, and private virtual hosts bind to the NetBird address. No NixOS
installation, rebuild, enrollment or secret access was performed for the article.

Additional primary references:

- https://nix.dev/concepts/flakes.html (flake inputs and lock file)
- https://nix-community.github.io/nixos-anywhere/ (remote installation)
- https://caddyserver.com/docs/automatic-https#dns-challenge (certificate validation
  through TXT records without exposing the requesting server)

The revised opening describes the intended experience, not an invented quotation
from the family. The restore story retains its documented initial failure and
the limit that it exercised components on an existing working cluster.

The final engagement revision adds progressive-enhancement controls to the
architecture component. Overview, family chat after sign-in, and private Grafana
access reuse the same diagram. Numbered outlines and live text explain the paths;
the figure remains readable without JavaScript. It performs no network probes and
shows no simulated latency or health. Authentik is described as the sign-in flow,
not as a proxy in every model request. The short Kubernetes tradeoff passage is
grounded in `plan.md`'s explicit learning goals and the documented project uses.

Publication review on September 8 found the website pipeline had completed its
publishing cutover during article preparation. The article was updated to reflect
`docs/nheer-workflows.md`'s verified September 8 cutover and the current
`cluster/apps/nheer/schedule.yaml` (`publish`, every three hours). Earlier entries
above describing check mode document the evidence available during drafting.

## Revisions

- 2026-09-21: prose pass at the author's request so the article reads less like generated text; plainer section titles, no factual or visual changes. Inky lines kept.
