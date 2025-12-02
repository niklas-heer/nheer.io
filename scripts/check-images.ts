const env = process.env;

async function checkImages() {
  const { Client } = await import("pg");
  const client = new Client({ connectionString: env.DATABASE_URL });
  await client.connect();

  const result = await client.query(`
    SELECT title, image_url 
    FROM podcasts 
    WHERE is_subscribed = true 
    LIMIT 10
  `);

  console.log("Sample podcast images:");
  result.rows.forEach((row) => {
    console.log(`  ${row.title}: ${row.image_url || 'NULL'}`);
  });

  const countNull = await client.query(`
    SELECT COUNT(*) FROM podcasts WHERE image_url IS NULL AND is_subscribed = true
  `);
  const countTotal = await client.query(`
    SELECT COUNT(*) FROM podcasts WHERE is_subscribed = true
  `);

  console.log(`\nPodcasts without images: ${countNull.rows[0].count}/${countTotal.rows[0].count}`);

  await client.end();
}

checkImages();
