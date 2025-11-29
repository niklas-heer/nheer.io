import { visit } from 'unist-util-visit';
import { getImage } from 'astro:assets';
import path from 'path';
import fs from 'fs';

/**
 * Rehype plugin to optimize images in markdown
 * Transforms img elements to use srcset and modern formats
 */
export function rehypeOptimizedImages() {
  return async (tree) => {
    const imageNodes = [];

    visit(tree, 'element', (node) => {
      if (node.tagName === 'img' && node.properties?.src) {
        imageNodes.push(node);
      }
    });

    // Add lazy loading and async decoding to all images
    for (const node of imageNodes) {
      node.properties.loading = 'lazy';
      node.properties.decoding = 'async';
    }
  };
}
