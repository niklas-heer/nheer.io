// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import expressiveCode from "astro-expressive-code";
import mdx from "@astrojs/mdx";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { remarkHugoShortcodes } from "./src/utils/remark-hugo-shortcodes";
import { remarkOptimizeImages } from "./src/utils/remark-optimize-images.mjs";

// https://astro.build/config
export default defineConfig({
  image: {
    // Enable image optimization with responsive layout
    experimentalLayout: "responsive",
    service: {
      entrypoint: "astro/assets/services/sharp",
      config: {
        limitInputPixels: false,
      },
    },
    // Allow remote images from Pocket Casts CDN
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.pocketcasts.com",
      },
    ],
  },
  site: "https://nheer.com",
  integrations: [
    expressiveCode({
      themes: ["tokyo-night", "github-light"],
      themeCssSelector: (theme) => {
        // Use tokyo-night for dark mode, github-light for light mode
        if (theme.name === "tokyo-night") return '[data-theme="dark"]';
        if (theme.name === "github-light") return '[data-theme="light"]';
        return `[data-theme="${theme.name}"]`;
      },
    }),
    mdx(),
  ],
  markdown: {
    remarkPlugins: [remarkHugoShortcodes, remarkOptimizeImages],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "wrap",
          properties: {
            className: ["anchor-link"],
          },
        },
      ],
    ],
  },
  i18n: {
    defaultLocale: "en",
    locales: ["en", "de"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
