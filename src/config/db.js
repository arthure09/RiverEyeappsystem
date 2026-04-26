require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

pool.on('connect', () => {
  console.log('PostgreSQL connection pool established.');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle pg client', err);
});

module.exports = pool;
