import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const posts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    author: z.string().default("Niklas Heer"),
    tags: z.array(z.string()).optional(),
    toc: z.boolean().default(false),
    draft: z.boolean().default(false),
    archive: z.boolean().default(false),
    lang: z.enum(["en", "de"]).default("en"),
    icon: z.string().optional(),
    // Inky's pre-generated heckles, one per section id (see scripts/inky-heckle.ts).
    inky: z
      .array(z.object({ section: z.string(), comment: z.string() }))
      .optional(),
  }),
});

const reviews = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/reviews" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    rating: z.number().min(0).max(5),
    reviewType: z
      .enum(["book", "movie", "podcast", "tool", "course", "other"])
      .default("book"),
    // Book-specific fields
    readingStart: z.coerce.date().optional(),
    readingEnd: z.coerce.date().optional(),
    bookCover: z.string().optional(),
    bookAuthor: z.string().optional(),
    tool: z.enum(["audible", "physical", "kindle"]).optional(),
    // General fields
    author: z.string().default("Niklas Heer"),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().default(false),
    lang: z.enum(["en", "de"]).default("en"),
  }),
});

// One file per project; see docs/projects.md. Images live beside the file.
const projects = defineCollection({
  loader: glob({ pattern: "*.{md,mdx}", base: "./src/content/projects" }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().min(1),
        tagline: z.string().min(1).max(80),
        summary: z.string().min(1).max(220),
        category: z.enum(["tools", "apps", "web", "games", "infrastructure"]),
        status: z.enum(["active", "maintained", "experimental", "paused", "archived"]),
        visibility: z.enum(["public", "private"]),
        // Public projects only. A private project's checkout is named in the
        // untracked .projects-local.json, so its repository never reaches this
        // public site repository.
        repo: z.string().regex(/^[\w.-]+\/[\w.-]+$/, "owner/name").optional(),
        homepage: z.url().optional(),
        docs: z.url().optional(),
        started: z.coerce.date(),
        stack: z.array(z.string().min(1)).min(2).max(6),
        install: z.string().min(1).refine((value) => !value.includes("\n"), "one line").optional(),
        featured: z.number().int().positive().optional(),
        cover: image(),
        coverAlt: z.string().min(1),
        gallery: z
          .array(z.object({ src: image(), alt: z.string().min(1), caption: z.string().optional() }))
          .max(4)
          .default([]),
        posts: z.array(z.string().regex(/^\/posts\/[^?#\s]+$/, "a site path such as /posts/2025/11/slug/")).default([]),
        highlights: z.array(z.string().min(1).max(60)).length(3).optional(),
        // Hide when the work happened: no weekly chart, last commit or commit
        // count, and only the year it started.
        hideActivity: z.boolean().optional(),
      })
      .strict()
      .superRefine((data, context) => {
        if (data.visibility === "public" && !data.repo) {
          context.addIssue({ code: "custom", path: ["repo"], message: "a public project needs repo: owner/name" });
        }
        if (data.visibility === "private" && data.repo) {
          context.addIssue({
            code: "custom",
            path: ["repo"],
            message: "a private project must not name its repository; map its checkout in .projects-local.json",
          });
        }
      }),
});

export const collections = {
  posts,
  reviews,
  projects,
};
