// Site configuration - central place for author info and social links

export const siteConfig = {
    author: {
        name: "Niklas Heer",
        email: "me@nheer.io",
        role: "Engineering Manager",
        company: "Tradebyte",
        tagline: "Working on open source software and empowering developers.",
    },
    social: {
        github: "https://github.com/niklas-heer",
        linkedin: "https://linkedin.com/in/niklas-heer-b89364b8",
        twitter: "https://twitter.com/niklas_heer",
    },
} as const;

export type SiteConfig = typeof siteConfig;
