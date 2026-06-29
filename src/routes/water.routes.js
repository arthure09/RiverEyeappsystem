const express = require('express');
const router = express.Router();

const UPSTREAM = 'https://water.serverlucas.my.id/api/readings';

router.get('/', async (req, res) => {
  try {
    const params = new URLSearchParams();
    if (req.query.device_id) params.set('device_id', req.query.device_id);
    params.set('limit', req.query.limit || '50');

    const upstream = await fetch(`${UPSTREAM}?${params}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });
    if (!upstream.ok) return res.status(upstream.status).json({ message: 'Upstream error' });

    const data = await upstream.json();
    res.json(data);
  } catch {
    res.status(502).json({ message: 'Gagal menghubungi server sensor.' });
  }
});

module.exports = router;
