const express = require('express');
const router = express.Router();
const { getConnection } = require('../db/connection');
const authMiddleware = require('../middleware/auth');

// GET /api/sections - List all sections
router.get('/', authMiddleware, (req, res) => {
  const db = getConnection();
  const sections = db.prepare('SELECT * FROM sections ORDER BY display_order').all();
  res.json({ sections });
});

module.exports = router;
