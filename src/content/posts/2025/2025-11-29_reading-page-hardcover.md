---
title: "My Reading Dashboard"
icon: ":books:"
date: "2025-11-29T21:00:00+01:00"
author: "Niklas Heer"
description: "How I built a personal reading dashboard using Hardcover's GraphQL API and Astro"
toc: false
tags: ["hardcover", "astro", "graphql", "reading"]
lang: "en"
---

I've always wanted a dedicated space on my website to showcase my reading journey. With the recent migration to Astro, I finally built it - a [reading page](/reading) that pulls data directly from [Hardcover](https://hardcover.app), my book tracking platform of choice.

![Reading page stats section](/assets/images/2025/reading-stats.png)

## Why Hardcover?

Before Hardcover, I used Goodreads like most people. But Goodreads feels stuck in 2010 - the UI is clunky, the app is slow, and Amazon's ownership makes me uncomfortable.

Hardcover is a modern alternative built by readers for readers. It has:

- A clean, fast interface
- Great book data and recommendations  
- An active community
- And most importantly: **a GraphQL API**

That last point is what makes this integration possible.

## The Architecture

The reading page is built at **build time**, not runtime. When I deploy my site, Astro fetches the latest data from Hardcover's API and generates static HTML. This means:

- No loading spinners for visitors
- No API calls on every page view
- Fast page loads

The tradeoff is that the data is only as fresh as my last deploy. For a reading page that changes maybe once a week, that's perfectly fine.

## Fetching the Data

Hardcover uses GraphQL, which lets me request exactly the data I need in a single query:

```graphql
query GetReadingData {
  me {
    username
    name
    image { url }
    goals(where: { state: { _eq: "active" } }, limit: 1) {
      goal
      progress
    }
    currently_reading: user_books(
      where: { status_id: { _eq: 2 } }
      order_by: { updated_at: desc }
    ) {
      book {
        title
        slug
        pages
        image { url }
        contributions { author { name } }
      }
      user_book_reads {
        started_at
        progress
      }
    }
    recently_read: user_books(
      where: { status_id: { _eq: 3 } }
      order_by: { last_read_date: desc }
    ) {
      rating
      has_review
      last_read_date
      book { ... }
    }
  }
}
```

One query gets me everything: profile info, reading goals, currently reading books with progress, and my entire reading history.

## The Stats Dashboard

The top of the page shows key reading stats:

- **Profile card** linking to my Hardcover profile
- **Reading goal progress** with a visual progress bar
- **Pages per day** calculated from this year's reading
- **Total books finished** across all time
- **Pages read this year** 
- **Average days per book** for completed reads

Each stat card has a slightly different visual treatment to keep things interesting - some have icons, others have animated elements.

## Currently Reading

![Currently reading section](/assets/images/2025/reading-currently.png)

This section shows books I'm actively reading with:

- Cover image
- Title and author
- **Reading progress** as a percentage bar
- Start date and days reading

The progress data comes from Hardcover's reading journals, which track when you update your progress.

## Reading Timeline

![Reading timeline](/assets/images/2025/reading-timeline.png)

The bulk of the page is a timeline of finished books, grouped by year and month. Each book shows:

- Cover thumbnail
- Title and author
- Star rating
- Days to complete (if I have start/end dates)
- A "Review" badge linking to my Hardcover review

The timeline uses a vertical line with dots for each month, giving it a visual flow that makes browsing years of reading history enjoyable.

## Environment Setup

To make this work, you need a Hardcover API token. Get one from your [Hardcover account settings](https://hardcover.app/account/api), then add it to your environment:

```bash
# .env
HARDCOVER_API_TOKEN=your_token_here
```

For deployment, add the same variable to your hosting platform (Netlify, Vercel, etc.).

## The Code

The implementation lives in a few files:

- `src/utils/hardcover.ts` - API client with TypeScript types
- `src/pages/reading.astro` - The page component with stats calculations

The utility handles the GraphQL query, authentication, and provides helper functions for things like getting author names and calculating reading duration.

## Lessons Learned

**GraphQL introspection is your friend.** Hardcover's documentation is limited, but I could query the schema directly to discover available fields and their types.

**Build-time data fetching is powerful.** No client-side JavaScript needed, no loading states, just fast static HTML with fresh-ish data.

**Group and visualize.** Raw lists of books aren't that interesting. Grouping by time and adding visual hierarchy (year pills, month labels, timeline dots) makes the data much more engaging.

## Try It Out

Check out the [reading page](/reading) to see it in action. If you're on Hardcover, feel free to [follow me](https://hardcover.app/@nheer) - I'm always looking for book recommendations!

The code is open source as part of this site's repo if you want to build something similar for your own site.

[hardcover]: https://hardcover.app
[astro]: https://astro.build
