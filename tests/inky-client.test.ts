import { expect, test } from "bun:test";
import {
  INKY_EXHAUSTED_LINES,
  INKY_HIDDEN_KEY,
  createInkyDeck,
  readInkyHidden,
  shuffle,
  sourceOf,
  writeInkyHidden,
  type InkyLine,
} from "../src/utils/inky-client";

const lines: InkyLine[] = [
  { comment: "one", sourceType: "general", sourceTitle: null, sourceUrl: null },
  { comment: "two", sourceType: "hackernews", sourceTitle: "A story", sourceUrl: "https://example.com/a" },
  { comment: "three", sourceType: "devops", sourceTitle: null, sourceUrl: "https://example.com/b" },
];

function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

test("shuffle keeps every item once and leaves the input alone", () => {
  const input = [1, 2, 3, 4, 5];
  const out = shuffle(input, seeded(7));
  expect(out.sort()).toEqual([1, 2, 3, 4, 5]);
  expect(input).toEqual([1, 2, 3, 4, 5]);
  expect(shuffle(input, () => 0)).toEqual([2, 3, 4, 5, 1]);
});

test("a deck says each line exactly once, then only exhausted lines", () => {
  const deck = createInkyDeck(lines, seeded(3));
  const spoken = [deck.next(), deck.next(), deck.next()];
  expect(spoken.map((turn) => turn.text).sort()).toEqual(["one", "three", "two"]);
  expect(spoken.every((turn) => !turn.exhausted)).toBe(true);
  expect(spoken.map((turn) => turn.shown)).toEqual([1, 2, 3]);
  expect(deck.total).toBe(3);

  for (let i = 0; i < 20; i++) {
    const turn = deck.next();
    expect(turn.exhausted).toBe(true);
    expect(turn.source).toBeNull();
    expect(INKY_EXHAUSTED_LINES).toContain(turn.text);
    expect(turn.shown).toBe(3);
  }
});

test("an empty deck is exhausted from the first click", () => {
  const turn = createInkyDeck([], () => 0.999).next();
  expect(turn.exhausted).toBe(true);
  expect(turn.text).toBe(INKY_EXHAUSTED_LINES[INKY_EXHAUSTED_LINES.length - 1]);
});

test("only news lines with a web URL get a source link", () => {
  expect(sourceOf(lines[0])).toBeNull();
  expect(sourceOf({ comment: "x", sourceType: "hackernews", sourceUrl: "general-123" })).toBeNull();
  expect(sourceOf(lines[1])).toEqual({
    type: "hackernews",
    label: "Hacker News",
    url: "https://example.com/a",
    title: "A story",
  });
  expect(sourceOf(lines[2])).toMatchObject({ label: "DevOps.com", title: "Read article" });
  expect(sourceOf({ comment: "x", sourceType: "rss", sourceUrl: "https://example.com/c" })?.label).toBe("Source");
});

test("the hidden preference round-trips through storage", () => {
  const values = new Map<string, string>();
  const storage = () => ({
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
  });
  expect(readInkyHidden(storage)).toBe(false);
  writeInkyHidden(true, storage);
  expect(values.get(INKY_HIDDEN_KEY)).toBe("true");
  expect(readInkyHidden(storage)).toBe(true);
  writeInkyHidden(false, storage);
  expect(values.has(INKY_HIDDEN_KEY)).toBe(false);
  expect(readInkyHidden(storage)).toBe(false);
});

test("blocked storage neither throws nor hides the mascot", () => {
  const blocked = () => {
    throw new DOMException("Storage blocked", "SecurityError");
  };
  expect(readInkyHidden(blocked)).toBe(false);
  expect(() => writeInkyHidden(true, blocked)).not.toThrow();
});
