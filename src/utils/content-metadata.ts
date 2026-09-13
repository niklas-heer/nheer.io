import type { CollectionEntry } from "astro:content";
import { parseEmoji } from "./emoji";

export function isPublished(entry: { data: { draft: boolean } }): boolean {
    return !entry.data.draft;
}

export function getPostPath(post: CollectionEntry<"posts">): string {
    const date = new Date(post.data.date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `/posts/${year}/${month}/${post.id.split("/").pop()}/`;
}

export function getReviewPath(review: CollectionEntry<"reviews">): string {
    return `/reviews/${review.id}/`;
}

/** Plain text for metadata and feeds; never used to rewrite article content. */
export function plainText(text: string): string {
    return parseEmoji(text
        .replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, " ")
        .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
        .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        .replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1")
        .replace(/^\s*\[[^\]]+\]:.*$/gm, " ")
        .replace(/<[^>]*>/g, " ")
        .replace(/\{\{[<%][\s\S]*?[>%]\}\}/g, " ")
        .replace(/^\s{0,3}#{1,6}\s+.*$/gm, " ")
        .replace(/^\s*(?:[-*+]\s+|\d+\.\s+|>\s*)/gm, "")
        .replace(/\*\*|__|~~|`/g, "")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/\s+/g, " ")
        .trim());
}

export function getPostDescription(post: CollectionEntry<"posts">): string {
    if (post.data.description?.trim()) return plainText(post.data.description);
    const text = plainText(post.body || "") || plainText(post.data.title);
    if (text.length <= 160) return text;
    const excerpt = text.slice(0, 157).replace(/\s+\S*$/, "");
    return `${excerpt}…`;
}
