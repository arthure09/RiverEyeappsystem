require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// Migrasi tambahan untuk fitur admin: kolom kamera/risiko di locations + tabel admins.
// Idempotent — aman dijalankan berulang.
async function migrate() {
  let client;
  try {
    client = await pool.connect();
    console.log('Connected to PostgreSQL. Running admin migration...');

    await client.query('BEGIN');

    // Kolom tambahan pada locations (yang dibutuhkan aplikasi & web admin)
    await client.query(`
      ALTER TABLE locations
        ADD COLUMN IF NOT EXISTS has_sensor    BOOLEAN DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS has_camera    BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS cctv_url      TEXT,
        ADD COLUMN IF NOT EXISTS risk_medium_cm INT DEFAULT 150,
        ADD COLUMN IF NOT EXISTS risk_high_cm   INT DEFAULT 200,
        ADD COLUMN IF NOT EXISTS status_override VARCHAR(20),
        ADD COLUMN IF NOT EXISTS description   TEXT,
        ADD COLUMN IF NOT EXISTS created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);
    console.log('locations table extended.');

    // Tabel admin untuk login web admin
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('admins table ready.');

    // Seed admin default dari .env (atau admin/admin123)
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const hash = await bcrypt.hash(password, 10);
    await client.query(
      `INSERT INTO admins (username, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (username) DO NOTHING`,
      [username, hash],
    );
    console.log(`Default admin ensured (username: ${username}).`);

    // Sinkronkan sequence id (seed memakai id eksplisit → nextval bisa tertinggal)
    for (const table of ['locations', 'sensor_logs', 'ml_predictions']) {
      await client.query(
        `SELECT setval(pg_get_serial_sequence($1, 'id'),
           GREATEST((SELECT COALESCE(MAX(id), 0) FROM ${table}), 1))`,
        [table],
      );
    }
    console.log('Sequences resynced.');

    await client.query('COMMIT');
    console.log('Migration completed successfully.');
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Migration failed. Rolling back:', error.message);
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    pool.end();
  }
}

migrate();
