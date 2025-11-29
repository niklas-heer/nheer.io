import { visit } from 'unist-util-visit';

/**
 * Remark plugin to transform image paths for Astro optimization
 * Changes /assets/images/... to use src/assets/images/... imports
 */
export function remarkOptimizeImages() {
  return (tree) => {
    visit(tree, 'image', (node) => {
      // Add loading="lazy" and decoding="async" via data attributes
      // that will be passed through to the HTML
      if (!node.data) {
        node.data = {};
      }
      if (!node.data.hProperties) {
        node.data.hProperties = {};
      }

      node.data.hProperties.loading = 'lazy';
      node.data.hProperties.decoding = 'async';

      // For GIFs, don't try to optimize (they lose animation)
      // For external URLs, skip optimization
      const src = node.url;
      if (src.endsWith('.gif') || src.startsWith('http://') || src.startsWith('https://')) {
        return;
      }
    });
  };
}
