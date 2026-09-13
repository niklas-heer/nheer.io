import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const title = process.argv[2]?.trim();
if (!title) throw new Error('Usage: mise run new-post "Post title"');

const slug = title
  .normalize("NFKD")
  .replace(/\p{Mark}/gu, "")
  .toLowerCase()
  .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
  .replace(/^-+|-+$/g, "");
if (!slug) throw new Error("The title must contain a letter or number");

const date = new Date().toISOString();
const directory = join("src/content/posts", date.slice(0, 4));
const path = join(directory, `${date.slice(0, 10)}_${slug}.md`);
mkdirSync(directory, { recursive: true });
writeFileSync(path, `---
title: ${JSON.stringify(title)}
date: ${date}
description: ""
author: Niklas Heer
tags: []
lang: en
draft: true
---

Write your post here...
`, { flag: "wx" });
console.log(`Created: ${path}`);
