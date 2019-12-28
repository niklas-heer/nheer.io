---
title: Using hugo environments with Netlify
icon: ":star:"
date: 2019-11-01T01:58:36+01:00
author: Niklas Heer
toc: false
images:
tags:
  - blog
  - hugo
  - netlify
  - env
  - config
  - draft
---

{{< figure src="/assets/images/2019/2019-11-01_draft.png" >}}

I'm using Hugo for my blog and I wanted to find a way in which I can view drafts while developing, but hide them on the deployed site.

Luckily `hugo` has a mechanism for that. It is a combination of features.
First you need to set up a config directory instead of only a config file like `config.toml`. The docs [hugo docs](https://gohugo.io/getting-started/configuration/#configuration-directory) give you a good overview of what to do. I choose a very simple setup for now:

```plain
config
├── _default
│   └── config.toml
└── development
    └── config.toml
```

I just copied my already used `config.toml` file into the `config/_defaults` folder which acts as a base for all environment. You can then overwrite settings in environments you use. I created a `development` folder because this is the environment which gets used when you use the `hugo server` command. In this file I just overwrite the `buildDrafts` setting which looks like this:

```toml
buildDrafts = true
```

I develop my site with the [Netlify CLI](https://cli.netlify.com/netlify-dev) using the `netlify dev` command. Which works great out of the box with the standard setup. But once I switched to the new setup it didn't detect my site as a hugo one.

So I also needed to overwrite the `netlify.toml` by adding this:

```toml
[dev]
command = "hugo server -w"
port = 8888
targetPort = 1313
publish = "dist"
```

The `targetPort` is needed because `hugo server` starts the sever per default on port `1313` and the Netlify CLI proxies to that port.

It works great but maybe the [detection of the Netlify CLI can be improved](https://github.com/netlify/cli/blob/1e3167cc241b514ccc6e8288313c6c50825bb7f7/src/detectors/hugo.js#L4) in the future.

Maybe I can also add other environments in the future like using the same approach for branch deploys with Netlify which should be as easy as adding a `config/staging` folder and a new `config.toml` file with the settings to be overwritten. After that I only would need to change the `netlify.toml` like this:

```toml
[context.branch-deploy]
command = "hugo --gc --minify -b $DEPLOY_PRIME_URL --environment staging"
```

The important part is `--environment staging`.

But let's see if I will need that. I'll let you know in another post. :wink:
