import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { getPostDescription, getPostPath, plainText } from '../utils/content-metadata';

export async function GET(context: APIContext) {
  const posts = await getCollection('posts', ({ data }) => {
    return !data.draft && !data.archive && data.lang === 'en';
  });

  const sortedPosts = posts
    .sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime())
    .slice(0, 10); // Limit to 10 items

  return rss({
    title: "Niklas Heer's Blog",
    description: 'Thoughts on Leadership, DevSecOps, and Quality',
    site: context.site || 'https://nheer.com',
    items: sortedPosts.map((post) => ({
        title: plainText(post.data.title),
        pubDate: new Date(post.data.date),
        description: getPostDescription(post),
        link: getPostPath(post),
        author: post.data.author,
    })),
    customData: `<language>en-us</language>`,
  });
}
