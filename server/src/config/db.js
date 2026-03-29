const { Pool } = require('pg');
const { DATABASE_URL } = require('./env');

const pool = new Pool({
  connectionString: DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err);
  process.exit(-1);
});

pool.query('SELECT NOW()').then(() => {
  console.log('PostgreSQL connected successfully');
}).catch((err) => {
  console.error('PostgreSQL connection failed:', err.message);
  process.exit(1);
});

module.exports = pool;