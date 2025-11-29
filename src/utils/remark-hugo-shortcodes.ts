import { visit } from 'unist-util-visit';
import type { Root, Text, Html } from 'mdast';
import { emojify } from 'node-emoji';

// Emoji aliases that node-emoji doesn't recognize
const emojiAliases: Record<string, string> = {
  ':thumbsup:': ':+1:',
  ':thumbs_up:': ':+1:',
  ':thumbsdown:': ':-1:',
  ':thumbs_down:': ':-1:',
};

function convertEmoji(text: string): string {
  // First, replace known aliases
  for (const [alias, replacement] of Object.entries(emojiAliases)) {
    text = text.replaceAll(alias, replacement);
  }
  return emojify(text);
}

/**
 * Remark plugin to convert Hugo shortcodes and emoji in markdown
 */
export function remarkHugoShortcodes() {
  return (tree: Root) => {
    // Convert text nodes with emoji shortcodes
    visit(tree, 'text', (node: Text) => {
      if (node.value.includes(':')) {
        node.value = convertEmoji(node.value);
      }
    });

    // Convert Hugo shortcodes in text to HTML
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === undefined) return;

      // Handle {{< quote "text" >}} shortcode
      const quoteRegex = /\{\{<\s*quote\s+"([^"]+)"(?:\s+"([^"]+)")?\s*>\}\}/g;
      if (quoteRegex.test(node.value)) {
        const newValue = node.value.replace(quoteRegex, (_match, quote, author) => {
          if (author) {
            return `<blockquote><p>${quote}</p><footer>— ${author}</footer></blockquote>`;
          }
          return `<blockquote><p>${quote}</p></blockquote>`;
        });

        const htmlNode: Html = {
          type: 'html',
          value: newValue
        };
        parent.children[index] = htmlNode;
      }
    });

    // Handle {{% info %}}...{{%/ info %}} blocks
    visit(tree, 'paragraph', (node, index, parent) => {
      if (!parent || index === undefined) return;

      // Check if paragraph contains info shortcode
      const textContent = node.children
        .filter((child): child is Text => child.type === 'text')
        .map(child => child.value)
        .join('');

      if (textContent.includes('{{% info %}}') || textContent.includes('{{%/ info %}}')) {
        // This is complex - we'll handle it at the raw text level instead
        return;
      }
    });
  };
}

export default remarkHugoShortcodes;
