import { defineCollection, z } from "astro:content";

const posts = defineCollection({
  type: "content",
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
  }),
});

const reviews = defineCollection({
  type: "content",
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

export const collections = {
  posts,
  reviews,
};
