require('dotenv').config();
const pool = require('../config/db');

async function seedDatabase() {
  let client;
  try {
    client = await pool.connect();
    console.log("Menambahkan data lokasi awal (seeding) ke tabel locations...");
    
    await client.query(`
      INSERT INTO locations (id, name, latitude, longitude, elevation)
      VALUES 
        (1, 'Pos Pemantauan Pintu Air Manggarai', -6.2088, 106.8456, 12.5),
        (2, 'Pos Pemantauan Bendungan Katulampa', -6.6322, 106.8364, 250.0),
        (3, 'Pos Pemantauan Karet', -6.2014, 106.8145, 10.2)
      ON CONFLICT (id) DO NOTHING;
    `);
    
    console.log("Data lokasi berhasil ditambahkan!");
  } catch (error) {
    console.error("Error saat menambahkan data:", error.message);
  } finally {
    if (client) client.release();
    pool.end();
  }
}

seedDatabase();
