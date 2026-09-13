import { describe, expect, test } from 'bun:test';
import { optimizeContentImages } from '../src/utils/optimize-content';

const optimized = { src: '/_astro/photo.webp', srcset: '/_astro/photo.webp 400w', width: '400', height: '200' };

describe('article image markup', () => {
  test('renders responsive local images before JavaScript while preserving content', async () => {
    const script = '<script>if (a < b) console.log("a & b")</script>';
    const html = await optimizeContentImages(`<h2 id="heading">A &amp; B</h2>${script}<img src="/assets/images/photo.png" alt="A &amp; B">`, async () => optimized);
    expect(html).toContain('src="/_astro/photo.webp"');
    expect(html).toContain('srcset="/_astro/photo.webp 400w"');
    expect(html).toContain('width="400" height="200"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain(script);
    expect(html).toContain('alt="A &amp; B"');
    expect(html).toContain('<h2 id="heading">A &amp; B</h2>');
  });

  test('does not resolve GIFs, remote images, existing responsive images or absent images', async () => {
    const calls: string[] = [];
    const html = await optimizeContentImages('<img src="/assets/images/demo.gif"><img src="https://example.com/image.jpg"><img src="/assets/images/ready.jpg" srcset="ready.webp 400w" loading="eager"><img src="/assets/images/missing.jpg">', async src => { calls.push(src); return null; });
    expect(calls).toEqual(['/assets/images/missing.jpg']);
    expect(html).toContain('src="/assets/images/demo.gif"');
    expect(html).toContain('srcset="ready.webp 400w" loading="eager"');
    expect(html).toContain('src="/assets/images/missing.jpg"');
  });

  test('image-free posts do not resolve images or ship an image map', async () => {
    const html = await optimizeContentImages('<p>Hello.</p>', async () => { throw new Error('Unused image resolved'); });
    expect(html).toBe('<p>Hello.</p>');
  });

  test('preserves code-copy attributes containing literal HTML and quoted entities', async () => {
    const code = '<button data-code="<div class=&#x22;card&#x22;>\u007f<h1>{greeting}, World!</h1>\u007f<slot />\u007f<style>.card { padding: 1rem; }</style></div>">Copy</button>';
    const html = await optimizeContentImages(code, async () => { throw new Error('Code was parsed as an image'); });
    expect(html).toBe(code);
  });

  test('optimizes real images without touching image markup in code, scripts, comments or attributes', async () => {
    const before = '<button data-code="<img src=&#x22;/assets/images/example.png&#x22;>">Copy</button><!-- <img src="/assets/images/comment.png"> --><pre><code>&lt;img src="/assets/images/code.png"&gt;</code></pre>';
    const after = '<script>const example = \'<img src="/assets/images/script.png">\';</script><p>Text &amp; <em>spacing</em>.</p>';
    const calls: string[] = [];
    const html = await optimizeContentImages(`${before}<img src="/assets/images/photo.png" alt="A &quot;quote&quot; > B">${after}`, async src => { calls.push(src); return optimized; });
    expect(calls).toEqual(['/assets/images/photo.png']);
    expect(html.startsWith(before)).toBe(true);
    expect(html.endsWith(after)).toBe(true);
    expect(html).toContain('src="/_astro/photo.webp"');
    expect(html).toContain('alt="A &quot;quote&quot; > B"');
  });
});
