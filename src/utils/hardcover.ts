// Hardcover API utility for fetching reading data
// Docs: https://docs.hardcover.app/api/getting-started/

const HARDCOVER_API_URL = "https://api.hardcover.app/v1/graphql";

export interface Book {
  id: number;
  title: string;
  image?: {
    url: string;
  };
  slug: string;
  pages?: number;
  contributions: {
    author: {
      name: string;
    };
  }[];
}

export interface UserBookRead {
  started_at: string | null;
  finished_at?: string | null;
  progress?: number | null;
  progress_pages?: number | null;
}

export interface ReadingJournal {
  metadata: {
    progress?: number;
    progress_pages?: number;
  };
}

export interface UserBook {
  id: number;
  rating: number | null;
  has_review?: boolean;
  user_book_reads: UserBookRead[];
  reading_journals?: ReadingJournal[];
  first_started_reading_date?: string | null;
  last_read_date?: string | null;
  book: Book;
}

export interface Goal {
  goal: number;
  progress: number;
  start_date: string;
  end_date: string;
  metric: string;
}

export interface UserProfile {
  username: string;
  name: string;
  books_count: number;
  image?: {
    url: string;
  };
  goals: Goal[];
}

export interface ReadingData {
  profile: UserProfile | null;
  currentlyReading: UserBook[];
  recentlyRead: UserBook[];
}

// Status IDs in Hardcover
// 1 = Want to Read
// 2 = Currently Reading
// 3 = Read
// 4 = Did Not Finish

const READING_QUERY = `
  query GetReadingData {
    me {
      username
      name
      books_count
      image {
        url
      }
      goals(where: { state: { _eq: "active" } }, limit: 1) {
        goal
        progress
        start_date
        end_date
        metric
      }
      currently_reading: user_books(
        where: { status_id: { _eq: 2 } }
        order_by: { updated_at: desc }
        limit: 5
      ) {
        id
        rating
        first_started_reading_date
        user_book_reads(order_by: { started_at: desc_nulls_last }, limit: 1) {
          started_at
          progress
          progress_pages
        }
        reading_journals(
          where: { event: { _eq: "progress_updated" } }
          order_by: { created_at: desc }
          limit: 1
        ) {
          metadata
        }
        book {
          id
          title
          slug
          pages
          image {
            url
          }
          contributions(limit: 3) {
            author {
              name
            }
          }
        }
      }
      recently_read: user_books(
        where: { status_id: { _eq: 3 } }
        order_by: { last_read_date: desc_nulls_last }
        limit: 500
      ) {
        id
        rating
        has_review
        last_read_date
        user_book_reads(limit: 1) {
          started_at
          finished_at
        }
        book {
          id
          title
          slug
          pages
          image {
            url
          }
          contributions(limit: 3) {
            author {
              name
            }
          }
        }
      }
    }
  }
`;

export async function fetchReadingData(): Promise<ReadingData | null> {
  const token = import.meta.env.HARDCOVER_API_TOKEN;

  if (!token) {
    console.warn("HARDCOVER_API_TOKEN not set - skipping Hardcover data fetch");
    return null;
  }

  try {
    const response = await fetch(HARDCOVER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: token,
      },
      body: JSON.stringify({ query: READING_QUERY }),
    });

    if (!response.ok) {
      console.error(
        "Hardcover API error:",
        response.status,
        response.statusText,
      );
      return null;
    }

    const data = await response.json();

    if (data.errors) {
      console.error("Hardcover GraphQL errors:", data.errors);
      return null;
    }

    // me returns an array, get the first element
    const me = data.data?.me?.[0];

    return {
      profile: me
        ? {
            username: me.username,
            name: me.name,
            books_count: me.books_count,
            image: me.image,
            goals: me.goals || [],
          }
        : null,
      currentlyReading: me?.currently_reading || [],
      recentlyRead: me?.recently_read || [],
    };
  } catch (error) {
    console.error("Failed to fetch Hardcover data:", error);
    return null;
  }
}

// Helper to get author names as a string
export function getAuthors(book: Book): string {
  return (
    book.contributions.map((c) => c.author.name).join(", ") || "Unknown Author"
  );
}

// Helper to get Hardcover book URL
export function getBookUrl(book: Book): string {
  return `https://hardcover.app/books/${book.slug}`;
}

// Helper to get the latest read info
export function getLatestRead(userBook: UserBook): UserBookRead | null {
  return userBook.user_book_reads?.[0] || null;
}

// Helper to calculate days since started reading
export function getDaysReading(startedAt: string | null): number | null {
  if (!startedAt) return null;
  const start = new Date(startedAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Helper to get review URL
export function getReviewUrl(username: string, bookSlug: string): string {
  return `https://hardcover.app/books/${bookSlug}/reviews/@${username}`;
}
