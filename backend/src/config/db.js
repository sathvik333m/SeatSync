const { Pool } = require('pg');
const config = require('./env');

const pool = new Pool({
  host: config.DB_HOST,
  port: config.DB_PORT,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]:', err.message);
});

/**
 * Execute a single parameterized query with timing logs
 */
async function query(text, params = []) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[SQL Query] (${duration}ms): ${text.replace(/\s+/g, ' ').trim()}`);
    }
    return res;
  } catch (err) {
    const duration = Date.now() - start;
    console.error(`[SQL Error] (${duration}ms): ${err.message} | Query: ${text}`);
    throw err;
  }
}

/**
 * Acquire a dedicated client for multi-statement transactions (BEGIN/COMMIT/ROLLBACK)
 */
async function getClient() {
  const client = await pool.connect();
  const originalQuery = client.query.bind(client);
  const release = client.release.bind(client);

  // Wrap query for transaction timing
  client.query = async (...args) => {
    const start = Date.now();
    try {
      const res = await originalQuery(...args);
      const duration = Date.now() - start;
      const text = typeof args[0] === 'string' ? args[0] : args[0]?.text || '';
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[TX Query] (${duration}ms): ${text.replace(/\s+/g, ' ').trim()}`);
      }
      return res;
    } catch (err) {
      const duration = Date.now() - start;
      console.error(`[TX Error] (${duration}ms): ${err.message}`);
      throw err;
    }
  };

  return { client, release };
}

/**
 * Test database connectivity and verify btree_gist extension
 */
async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW() as current_time, current_database() as db_name;');
    const extCheck = await pool.query(
      "SELECT extname FROM pg_extension WHERE extname = 'btree_gist';"
    );
    const hasGist = extCheck.rows.length > 0;
    return {
      connected: true,
      time: res.rows[0].current_time,
      database: res.rows[0].db_name,
      btreeGistActive: hasGist,
    };
  } catch (err) {
    return {
      connected: false,
      error: err.message,
    };
  }
}

module.exports = {
  pool,
  query,
  getClient,
  testConnection,
};
