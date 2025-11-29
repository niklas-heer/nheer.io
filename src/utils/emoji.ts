import { emojify } from "node-emoji";

// Mapping for emoji aliases that node-emoji doesn't recognize
const emojiAliases: Record<string, string> = {
  ":thumbsup:": ":+1:",
  ":thumbs_up:": ":+1:",
  ":thumbsdown:": ":-1:",
  ":thumbs_down:": ":-1:",
};

/**
 * Convert emoji shortcodes like :wave: to actual emoji characters
 */
export function parseEmoji(text: string): string {
  if (!text) return text;

  // First, replace known aliases
  for (const [alias, replacement] of Object.entries(emojiAliases)) {
    text = text.replaceAll(alias, replacement);
  }

  return emojify(text);
}

/**
 * Parse simple markdown bold/italic in text (for titles/descriptions)
 */
export function parseInlineMarkdown(text: string): string {
  if (!text) return text;

  // Convert **bold** to <strong>
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Convert *italic* to <em>
  text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Convert `code` to <code>
  text = text.replace(/`(.+?)`/g, "<code>$1</code>");

  return text;
}

/**
 * Parse both emoji and inline markdown
 */
export function parseText(text: string): string {
  return parseInlineMarkdown(parseEmoji(text));
}
