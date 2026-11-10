---
title: "Homelab"
tagline: "A small Kubernetes platform for my family's apps and my own projects."
summary: >-
  Seven Kubernetes nodes and a NixOS host on Hetzner Cloud, declared in Git, running an AI chat page for my parents and the pipelines behind my projects.
category: infrastructure
status: active
visibility: private
started: 2026-04-06
stack: ["Talos Linux", "Kubernetes", "Argo CD", "Pulumi", "NixOS", "NetBird"]
cover: "./homelab/cover.webp"
coverAlt: "Diagram of the homelab: family browsers and private devices reach a NixOS utility host, which routes into a Talos Kubernetes cluster with family apps, project workflows and shared services"
posts:
  - "/posts/2026/09/2026-09-07_homelab-for-the-family/"
  - "/posts/2026/09/2026-09-20_an-octopus-in-the-corner/"
highlights:
  - "Talos Kubernetes on Hetzner Cloud"
  - "Infrastructure, apps and DNS in Git"
  - "Backups checked with restore drills"
---

It started with an AI family plan. I wanted my parents to open one page, sign in and ask a question, without first researching models and subscriptions. That page is Open WebUI. Behind it, LiteLLM sends requests to Eden AI with OpenRouter as a fallback, so I can change providers while the page stays the same.

The page now runs on a cluster that does a lot more. In Hetzner Cloud, three Talos Linux nodes form the Kubernetes control plane and four workers run the applications. A separate NixOS host routes web traffic with Caddy and is the way into a NetBird private network for administration. Authentik provides single sign-on, and besides the chat the family has apps for travel planning, shared documents and small databases.

Where I could, I picked providers based in the EU: Hetzner for servers and storage, Eden AI for model access, NetBird for the private network and INWX for DNS. The setup still depends on GitHub, 1Password and the OpenRouter fallback, so I see it as a direction more than a finished state.

Everything is described in Git. Pulumi, written in Python, provisions the infrastructure. Argo CD keeps the cluster in line with the repository, a NixOS flake describes the utility host, and even the DNS records live in a KDL file that tasks compare with the live zone before changing anything.

The cluster also works for my other projects. It refreshes this website's data, builds it, runs the browser checks and publishes the result, and it runs my benchmark workflows. Backups get restore drills. The most useful one so far failed, which showed me a gap while the original data was still there.

Seven nodes for three people is more than the chat page needs. Learning this kind of platform is part of why it exists.

The picture is a diagram based on the architecture I published in the post about it.
