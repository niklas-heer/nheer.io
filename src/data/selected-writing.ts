// The three articles the homepage opens with. They are picked by hand to show
// three sides of the writing, so they stay put while newer posts come and go.
// `id` is the post's content id (its path under src/content/posts, without the
// extension); the build fails if one no longer matches a published post.

export interface SelectedWriting {
    id: string;
    /** What this article stands for among the three. */
    lens: string;
    /** One sentence on why to read it. */
    sentence: string;
}

export const selectedWriting: readonly SelectedWriting[] = [
    {
        id: "2026/2026-09-20_the-compiler-can-yell-at-somebody-else",
        lens: "Working with agents",
        sentence:
            "The compiler that talked me out of Rust in 2018 became the best review I have, once agents were doing the typing.",
    },
    {
        id: "2026/2026-09-07_homelab-for-the-family",
        lens: "Running a platform",
        sentence: "An AI family plan for my parents turned into a small platform with real users.",
    },
    {
        id: "2026/2026-07-17_saving-a-markdown-file",
        lens: "Building small tools",
        sentence: "tdx is a small terminal app for the Markdown checkboxes you already have, README included.",
    },
];
