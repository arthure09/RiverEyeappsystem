const pool = require('../config/db');

// Kolom yang boleh diisi/diubah lewat web admin
const EDITABLE = [
  'name',
  'latitude',
  'longitude',
  'elevation',
  'has_sensor',
  'has_camera',
  'cctv_url',
  'risk_medium_cm',
  'risk_high_cm',
  'status_override',
  'description',
];

exports.getLocations = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM locations ORDER BY id ASC');
    res.status(200).json({
      status: 'success',
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve locations from the database.',
    });
  }
};

exports.getLocationById = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM locations WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Lokasi tidak ditemukan.' });
    }
    res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ status: 'error', message: 'Failed to retrieve location.' });
  }
};

exports.createLocation = async (req, res) => {
  // status_override kosong dari form → simpan NULL (mode otomatis dari sensor)
  if (req.body.status_override === '') req.body.status_override = null;

  const { name, latitude, longitude } = req.body;
  if (!name || latitude === undefined || longitude === undefined) {
    return res.status(400).json({
      status: 'error',
      message: 'name, latitude, dan longitude wajib diisi.',
    });
  }

  const cols = EDITABLE.filter((c) => req.body[c] !== undefined);
  const values = cols.map((c) => req.body[c]);
  const placeholders = cols.map((_, i) => `$${i + 1}`);

  try {
    const result = await pool.query(
      `INSERT INTO locations (${cols.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
      values,
    );
    res.status(201).json({
      status: 'success',
      message: 'Lokasi berhasil ditambahkan.',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ status: 'error', message: 'Gagal menambahkan lokasi.' });
  }
};

exports.updateLocation = async (req, res) => {
  // status_override kosong dari form → simpan NULL (mode otomatis dari sensor)
  if (req.body.status_override === '') req.body.status_override = null;

  const cols = EDITABLE.filter((c) => req.body[c] !== undefined);
  if (cols.length === 0) {
    return res.status(400).json({ status: 'error', message: 'Tidak ada data untuk diperbarui.' });
  }

  const setClause = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
  const values = cols.map((c) => req.body[c]);
  values.push(req.params.id);

  try {
    const result = await pool.query(
      `UPDATE locations SET ${setClause} WHERE id = $${values.length} RETURNING *`,
      values,
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Lokasi tidak ditemukan.' });
    }
    res.status(200).json({
      status: 'success',
      message: 'Lokasi berhasil diperbarui.',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ status: 'error', message: 'Gagal memperbarui lokasi.' });
  }
};

exports.deleteLocation = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM locations WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Lokasi tidak ditemukan.' });
    }
    res.status(200).json({ status: 'success', message: 'Lokasi berhasil dihapus.' });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ status: 'error', message: 'Gagal menghapus lokasi.' });
  }
};
