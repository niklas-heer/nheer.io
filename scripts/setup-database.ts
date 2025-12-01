// Database schema setup for Pocket Casts data

const env = process.env;

async function setupDatabase() {
  const { Client } = await import("pg");
  const client = new Client({ connectionString: env.DATABASE_URL });

  try {
    await client.connect();
    console.log("Connected to database...");

    // Create tables
    await client.query(`
      -- Daily listening stats snapshots
      CREATE TABLE IF NOT EXISTS listening_stats (
        date DATE PRIMARY KEY,
        time_listened BIGINT NOT NULL,
        time_silence_removal BIGINT DEFAULT 0,
        time_skipping BIGINT DEFAULT 0,
        time_intro_skipping BIGINT DEFAULT 0,
        time_variable_speed BIGINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Podcasts you're subscribed to
      CREATE TABLE IF NOT EXISTS podcasts (
        uuid TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT,
        description TEXT,
        image_url TEXT,
        url TEXT,
        category TEXT,
        folder TEXT,
        is_subscribed BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Episodes you've listened to
      CREATE TABLE IF NOT EXISTS episodes (
        uuid TEXT PRIMARY KEY,
        podcast_uuid TEXT REFERENCES podcasts(uuid),
        title TEXT NOT NULL,
        duration INTEGER,
        played_up_to INTEGER DEFAULT 0,
        published_at TIMESTAMP,
        first_seen_at DATE DEFAULT CURRENT_DATE,
        completed BOOLEAN DEFAULT false,
        starred BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Create indexes for common queries
      CREATE INDEX IF NOT EXISTS idx_episodes_podcast_uuid ON episodes(podcast_uuid);
      CREATE INDEX IF NOT EXISTS idx_episodes_first_seen_at ON episodes(first_seen_at);
      CREATE INDEX IF NOT EXISTS idx_listening_stats_date ON listening_stats(date);
      CREATE INDEX IF NOT EXISTS idx_podcasts_category ON podcasts(category);

      -- Inky comments table
      CREATE TABLE IF NOT EXISTS inky_comments (
        id SERIAL PRIMARY KEY,
        comment TEXT NOT NULL,
        source_type VARCHAR(50) NOT NULL,
        source_title TEXT,
        source_url TEXT UNIQUE,
        is_active BOOLEAN DEFAULT true,
        used_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_inky_comments_active ON inky_comments(is_active);
      CREATE INDEX IF NOT EXISTS idx_inky_comments_source_type ON inky_comments(source_type);
    `);

    console.log("Tables created successfully!");

    // Verify tables exist
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log("\nTables in database:");
    result.rows.forEach((row) => {
      console.log("  -", row.table_name);
    });

    await client.end();
    console.log("\nDatabase setup complete!");
  } catch (error: any) {
    console.error("Database setup failed:", error.message);
    process.exit(1);
  }
}

setupDatabase();
