require('dotenv').config();
const pool = require('../config/db');

async function initializeDatabase() {
  let client;
  try {
    client = await pool.connect();
    console.log("successfully connected to Supabase PostgreSQL.");

    await client.query('BEGIN');
    
    console.log("Creating locations table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS locations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        latitude FLOAT,
        longitude FLOAT,
        elevation FLOAT
      );
    `);

    console.log("🔨 Creating sensor_logs table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS sensor_logs (
        id SERIAL PRIMARY KEY,
        location_id INT REFERENCES locations(id) ON DELETE CASCADE,
        water_level_cm FLOAT NOT NULL,
        status VARCHAR(100),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("🔨 Creating ml_predictions table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS ml_predictions (
        id SERIAL PRIMARY KEY,
        location_id INT REFERENCES locations(id) ON DELETE CASCADE,
        predicted_level_cm FLOAT NOT NULL,
        prediction_for_time TIMESTAMP NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('COMMIT');
    console.log(" All tables created successfully!");

  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error("Error creating tables. Rolling back:", error.message);
  } finally {
    if (client) client.release();
    pool.end();
  }
}

initializeDatabase();
