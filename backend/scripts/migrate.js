const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const config = require('../src/config/env');

async function runMigration() {
  console.log(`\n======================================================`);
  console.log(`🔄 SeatSync Database Migration & Seeding Tool`);
  console.log(`Target: ${config.DB_USER}@${config.DB_HOST}:${config.DB_PORT}/${config.DB_NAME}`);
  console.log(`======================================================\n`);

  const pool = new Pool({
    host: config.DB_HOST,
    port: config.DB_PORT,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connection to PostgreSQL established.');

    // 1. Read schema.sql
    const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('📜 Applying database/schema.sql ...');
    await client.query(schemaSql);
    console.log('✅ Schema tables, constraints, and indexes created successfully.');

    // 2. Read seed.sql
    const seedPath = path.resolve(__dirname, '../../database/seed.sql');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    console.log('🌱 Applying database/seed.sql ...');
    await client.query(seedSql);
    console.log('✅ Realistic seed data inserted successfully.');

    // 3. Print verification counts
    const tableCounts = await client.query(`
      SELECT 
        (SELECT count(*) FROM users) as users,
        (SELECT count(*) FROM resources) as resources,
        (SELECT count(*) FROM reservations) as reservations,
        (SELECT count(*) FROM skills) as skills,
        (SELECT count(*) FROM learning_listings) as listings,
        (SELECT count(*) FROM learning_requests) as requests,
        (SELECT count(*) FROM learning_sessions) as sessions,
        (SELECT count(*) FROM session_participants) as participants,
        (SELECT count(*) FROM audit_logs) as audit_logs;
    `);

    console.log('\n📊 Database State Summary:');
    console.table(tableCounts.rows[0]);

    client.release();
    await pool.end();
    console.log('🎉 Migration completed successfully!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration Failed:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('👉 Make sure PostgreSQL is running on port 5432:');
      console.error('   run: "docker compose up -d"');
    }
    process.exit(1);
  }
}

runMigration();
