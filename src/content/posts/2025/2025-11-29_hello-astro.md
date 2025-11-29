---
title: "Hello Astro!"
icon: ":rocket:"
date: "2025-11-29T20:00:00+01:00"
author: "Niklas Heer"
description: "Why I migrated my personal site from Hugo to Astro"
toc: false
tags: ["astro", "hugo", "migration", "web"]
lang: "en"
---

## A Decade of Static Site Generators

Looking back at my blogging history, I've been through quite the journey:

- **2014**: [Hello Jekyll](/posts/2014/11/2014-11-30-hello-jekyll/) - My first static site generator
- **2015**: [Hello Hugo](/posts/2015/08/2015-08-18-hallo-hugo/) - Switched for speed
- **2025**: Hello Astro! - Here we are now

Each migration was driven by real pain points. Jekyll was slow and Ruby's gem system was frustrating. Hugo solved the speed problem brilliantly - builds in milliseconds. So why change again?

## Why Leave Hugo?

Hugo served me well for nearly a decade. It's still incredibly fast and reliable. But a few things started to bother me:

### Go Templating Syntax

Hugo uses Go's templating language, which can get... interesting:

```text
{{ if and (isset .Params "title") (isset .Params "date") }}
  {{ with .Params.title }}{{ . }}{{ end }}
{{ end }}
```

It works, but it's not exactly intuitive. Every time I came back to modify a template after a few months, I had to re-learn the syntax.

### Limited Interactivity

Hugo generates pure static HTML, which is great for performance. But when I wanted to add small interactive elements - like a theme toggle that persists, or a reading progress indicator - I was writing vanilla JavaScript in `<script>` tags, fighting with the build system.

### Component Thinking

Modern web development has embraced components. Having built applications with React and Vue, going back to Hugo's partial system felt like a step backwards.

## Why Astro?

[Astro](https://astro.build) hit the sweet spot for me:

### Familiar Syntax

Astro components look like a blend of HTML, JSX, and Vue SFCs:

```astro
---
// This is the "frontmatter" - runs at build time
const greeting = "Hello";
---

<div class="card">
  <h1>{greeting}, World!</h1>
  <slot />
</div>

<style>
  .card {
    padding: 1rem;
    border-radius: 0.5rem;
  }
</style>
```

The component script runs at build time by default, so you still get static HTML output. But you can opt-in to client-side JavaScript when needed.

### Islands Architecture

Astro's killer feature is [Islands](https://docs.astro.build/en/concepts/islands/). Most of my site is static HTML - no JavaScript needed. But for interactive bits like the theme toggle, I can "hydrate" just that component:

```astro
<ThemeToggle client:load />
```

The rest of the page stays as pure HTML. Best of both worlds.

### Content Collections

Astro has first-class support for content. My blog posts are type-safe:

```typescript
const schema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  tags: z.array(z.string()).optional(),
});
```

If I mess up the frontmatter, I get a build error. No more silent failures.

### Modern Tooling

Astro uses Vite under the hood. Hot module replacement is instant. TypeScript just works. Tailwind CSS integrates seamlessly. The developer experience is miles ahead.

## The Migration

Moving from Hugo to Astro was surprisingly smooth:

1. **Content**: Markdown files moved over with minimal changes. Just needed to adjust some frontmatter fields.

2. **Layouts**: Rewrote the templates as Astro components. Took some time, but the result is much cleaner.

3. **Shortcodes**: Hugo shortcodes became Astro components. The YouTube embed shortcode? Now it's just:

```astro
---
const { id } = Astro.props;
---
<iframe 
  src={`https://www.youtube.com/embed/${id}`}
  class="w-full aspect-video"
  allowfullscreen
/>
```

4. **New Features**: With Astro, I could easily add things I'd been wanting:
   - Dark/light theme with system preference detection
   - A [reading page](/reading) that fetches data from the Hardcover API
   - View transitions for smooth page navigation
   - Better code syntax highlighting with Expressive Code
   - Reading progress indicator for blog posts (try scrolling!)

## Performance

Both Hugo and Astro produce fast static sites. Build times are comparable for a site this size. The real difference is in what you can do:

| Feature | Hugo | Astro |
|---------|------|-------|
| Build Speed | ~100ms | ~1.5s |
| Hot Reload | Fast | Instant |
| Interactive Components | Manual JS | Islands |
| Type Safety | No | Yes |
| Modern CSS | Limited | Full Tailwind/PostCSS |

Hugo wins on raw build speed, but Astro's developer experience makes up for it.

## Conclusion

Hugo is still fantastic for pure static sites. If you want the fastest builds and don't need interactivity, it's hard to beat.

But for a personal site where I want to experiment, add interactive features, and enjoy modern tooling - Astro is the clear choice. The component model feels natural, the island architecture is clever, and the ecosystem is thriving.

Here's to the next decade of static site generators!

[astro]: https://astro.build/
[hugo]: https://gohugo.io/
