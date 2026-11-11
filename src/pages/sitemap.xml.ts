import { getCollection } from "astro:content";
import type { APIContext } from "astro";
import { getPostPath, getReviewPath, isPublished } from "../utils/content-metadata";
import { getProjectsData } from "../utils/project-data";

export async function GET({ site }: APIContext) {
    const [posts, reviews, { projects }] = await Promise.all([
        getCollection("posts", isPublished),
        getCollection("reviews", isPublished),
        getProjectsData(),
    ]);
    const pages = Object.keys(import.meta.glob("./*.astro"))
        .map((path) => path.replace("./", "").replace(".astro", ""))
        .filter((name) => name !== "404")
        .map((name) => name === "index" ? "/" : `/${name}/`);
    // Pages without a date of their own carry no <lastmod>.
    const entries = new Map<string, Date | undefined>([
        ...pages.map((path): [string, undefined] => [path, undefined]),
        ["/posts/", undefined],
        ["/reviews/", undefined],
        ["/projects/", undefined],
        ...projects.map((project): [string, undefined] => [`/projects/${project.slug}/`, undefined]),
        ...posts.map((post): [string, Date] => [getPostPath(post), post.data.date]),
        ...reviews.map((review): [string, Date] => [getReviewPath(review), review.data.date]),
    ]);
    const urls = [...entries].sort(([a], [b]) => a.localeCompare(b)).map(([path, date]) => {
        const url = new URL(path, site).href.replace(/&/g, "&amp;");
        const lastmod = date ? `<lastmod>${date.toISOString().slice(0, 10)}</lastmod>` : "";
        return `<url><loc>${url}</loc>${lastmod}</url>`;
    });
    return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`,
        { headers: { "Content-Type": "application/xml; charset=utf-8" } },
    );
}
