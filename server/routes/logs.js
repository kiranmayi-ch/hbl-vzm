const express = require('express');
const router = express.Router();
const { getConnection } = require('../db/connection');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/roleGuard');

// GET /api/logs - Activity logs with pagination (admin only)
router.get('/', authMiddleware, requireRole('admin'), (req, res) => {
  const { page = 1, limit = 50, action, user_id, entity } = req.query;
  const db = getConnection();

  let countSql = 'SELECT COUNT(*) as total FROM activity_logs WHERE 1=1';
  let sql = `
    SELECT al.*, u.name as user_name, u.employee_id
    FROM activity_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (action) { sql += ' AND al.action = ?'; countSql += ' AND action = ?'; params.push(action); }
  if (user_id) { sql += ' AND al.user_id = ?'; countSql += ' AND user_id = ?'; params.push(user_id); }
  if (entity) { sql += ' AND al.entity = ?'; countSql += ' AND entity = ?'; params.push(entity); }

  const total = db.prepare(countSql).get(...params).total;

  sql += ' ORDER BY al.timestamp DESC LIMIT ? OFFSET ?';
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const logs = db.prepare(sql).all(...params, parseInt(limit), offset);

  res.json({
    logs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

module.exports = router;
