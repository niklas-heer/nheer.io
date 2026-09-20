// Browser-safe Inky behaviour shared by the corner mascot and the article demo.
// No database imports here: this module ships to the client.

export interface InkyLine {
  comment: string;
  sourceType?: string | null;
  sourceTitle?: string | null;
  sourceUrl?: string | null;
}

export interface InkySource {
  type: string;
  label: string;
  url: string;
  title: string;
}

export interface InkyTurn {
  text: string;
  source: InkySource | null;
  /** Lines spoken so far, not counting exhausted lines. */
  shown: number;
  total: number;
  exhausted: boolean;
}

export const INKY_EXHAUSTED_LINES: readonly string[] = [
  "That concludes today's incident review. The deep is closed.",
  "Out of ink. Backups of my opinions will be available tomorrow.",
  "New achievement! Bottom Of The Page. You have exhausted the octopus. Reward: silence.",
  "Patch 1.0.1: the mascot now says nothing when clicked repeatedly. Working as intended.",
  "Nothing further from the deep. The surface may resume whatever it was doing.",
];

export const INKY_SOURCE_LABELS: Readonly<Record<string, string>> = {
  hackernews: "Hacker News",
  thenewstack: "The New Stack",
  devops: "DevOps.com",
};

/** Fisher–Yates shuffle into a new array; `random` must return [0, 1). */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/** A news line links to its story; general jokes and lines without a URL do not. */
export function sourceOf(line: InkyLine): InkySource | null {
  const type = line.sourceType ?? "general";
  const url = line.sourceUrl;
  if (type === "general" || !url || !/^https?:\/\//.test(url)) return null;
  return {
    type,
    label: INKY_SOURCE_LABELS[type] ?? "Source",
    url,
    title: line.sourceTitle || "Read article",
  };
}

export interface InkyDeck {
  readonly total: number;
  readonly shown: number;
  next(): InkyTurn;
}

/**
 * Shuffle the lines once, hand them out one per call, then only answer with
 * exhausted lines. This is the whole conversation model of the mascot.
 */
export function createInkyDeck(
  lines: readonly InkyLine[],
  random: () => number = Math.random,
): InkyDeck {
  const order = shuffle(lines, random);
  let shown = 0;
  return {
    total: order.length,
    get shown() {
      return shown;
    },
    next(): InkyTurn {
      if (shown < order.length) {
        const line = order[shown++];
        return { text: line.comment, source: sourceOf(line), shown, total: order.length, exhausted: false };
      }
      const pick = Math.min(INKY_EXHAUSTED_LINES.length - 1, Math.floor(random() * INKY_EXHAUSTED_LINES.length));
      return { text: INKY_EXHAUSTED_LINES[pick], source: null, shown, total: order.length, exhausted: true };
    },
  };
}
