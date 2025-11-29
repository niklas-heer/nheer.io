import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

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
    items: sortedPosts.map((post) => {
      const date = new Date(post.data.date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const slug = post.slug.split('/').pop();

      return {
        title: post.data.title,
        pubDate: new Date(post.data.date),
        description: post.data.description || '',
        link: `/posts/${year}/${month}/${slug}/`,
        author: post.data.author,
      };
    }),
    customData: `<language>en-us</language>`,
  });
}
