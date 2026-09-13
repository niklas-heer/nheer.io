import { getCollection } from "astro:content";
import type { APIContext } from "astro";
import { getPostPath, getReviewPath, isPublished } from "../utils/content-metadata";

export async function GET({ site }: APIContext) {
    const [posts, reviews] = await Promise.all([
        getCollection("posts", isPublished),
        getCollection("reviews", isPublished),
    ]);
    const pages = Object.keys(import.meta.glob("./*.astro"))
        .map((path) => path.replace("./", "").replace(".astro", ""))
        .filter((name) => name !== "404")
        .map((name) => name === "index" ? "/" : `/${name}/`);
    const paths = [
        ...pages,
        "/posts/",
        "/reviews/",
        ...posts.map(getPostPath),
        ...reviews.map(getReviewPath),
    ];
    const urls = [...new Set(paths)].sort().map((path) => {
        const url = new URL(path, site).href.replace(/&/g, "&amp;");
        return `<url><loc>${url}</loc></url>`;
    });
    return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`,
        { headers: { "Content-Type": "application/xml; charset=utf-8" } },
    );
}
