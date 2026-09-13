import { parseFragment, serializeOuter, type DefaultTreeAdapterTypes } from 'parse5';

type OptimizedImage = { src: string; srcset: string; width: string; height: string };

export async function optimizeContentImages(
  html: string,
  resolve: (src: string) => Promise<OptimizedImage | null>,
): Promise<string> {
  const tree = parseFragment(html, { sourceCodeLocationInfo: true });
  const replacements: { start: number; end: number; html: string }[] = [];

  async function visit(node: DefaultTreeAdapterTypes.Node): Promise<void> {
    if ('tagName' in node && node.tagName === 'img' && node.sourceCodeLocation?.startTag) {
      const attrs = Object.fromEntries(node.attrs.map(({ name, value }) => [name, value]));
      attrs.loading ||= 'lazy';
      attrs.decoding ||= 'async';
      // Existing responsive images, remote images, and animated GIFs stay intact.
      if (!attrs.srcset && attrs.src?.startsWith('/assets/images/') && !/\.gif(?:[?#]|$)/i.test(attrs.src)) {
        const image = await resolve(attrs.src);
        if (image) {
          Object.assign(attrs, image);
          attrs.sizes ||= '(max-width: 768px) calc(100vw - 2rem), 736px';
        }
      }
      node.attrs = Object.entries(attrs).map(([name, value]) => ({ name, value }));
      const { startOffset: start, endOffset: end } = node.sourceCodeLocation.startTag;
      replacements.push({ start, end, html: serializeOuter(node) });
    }
    if ('childNodes' in node) await Promise.all(node.childNodes.map(visit));
  }

  await visit(tree);
  // Only replace actual image tags. Keep code examples, copy-button attributes,
  // scripts, and every other part of the article exactly as Astro rendered them.
  for (const replacement of replacements.sort((a, b) => b.start - a.start)) {
    html = html.slice(0, replacement.start) + replacement.html + html.slice(replacement.end);
  }
  return html;
}
