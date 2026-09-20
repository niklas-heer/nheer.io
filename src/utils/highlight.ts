import { codeToHtml, type DecorationItem } from "shiki";

export interface MarkedText {
  /** Exact source text to wrap; must occur in the code. */
  text: string;
  /** Badge shown after the marked range, via the component's mark::after CSS. */
  mark: string;
}

/**
 * Highlight code for the dark article figures. One theme, because the figure
 * surface is dark in both site themes, and no inline background so the pane
 * keeps its own. Marked ranges become <mark data-mark="…"> around the tokens.
 */
export async function highlightDark(code: string, lang: string, marks: MarkedText[] = []): Promise<string> {
  const decorations: DecorationItem[] = marks.map(({ text, mark }) => {
    const start = code.indexOf(text);
    if (start < 0) throw new Error(`highlightDark: marked text not found in ${lang} source: ${text}`);
    return { start, end: start + text.length, tagName: "mark", properties: { "data-mark": mark } };
  });
  return codeToHtml(code, {
    lang,
    theme: "tokyo-night",
    decorations,
    transformers: [
      {
        pre(node) {
          delete node.properties.style;
        },
      },
    ],
  });
}
