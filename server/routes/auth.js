const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getConnection } = require('../db/connection');
const authMiddleware = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { employee_id, password } = req.body;

  if (!employee_id || !password) {
    return res.status(400).json({ error: 'Employee ID and password are required.' });
  }

  const db = getConnection();
  const user = db.prepare(`
    SELECT u.*, s.name as section_name, s.code as section_code
    FROM users u
    LEFT JOIN sections s ON u.section_id = s.id
    WHERE u.employee_id = ? AND u.is_active = 1
  `).get(employee_id.toUpperCase());

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const validPassword = bcrypt.compareSync(password, user.password_hash);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const token = jwt.sign(
    {
      id: user.id,
      employee_id: user.employee_id,
      name: user.name,
      role: user.role,
      section_id: user.section_id,
      section_name: user.section_name,
      section_code: user.section_code
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Log login activity
  db.prepare(
    'INSERT INTO activity_logs (user_id, action, entity, details, timestamp) VALUES (?, ?, ?, ?, ?)'
  ).run(user.id, 'login', 'user', JSON.stringify({ employee_id: user.employee_id }), new Date().toISOString());

  res.json({
    token,
    user: {
      id: user.id,
      employee_id: user.employee_id,
      name: user.name,
      role: user.role,
      section_id: user.section_id,
      section_name: user.section_name,
      section_code: user.section_code
    }
  });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  const db = getConnection();
  const user = db.prepare(`
    SELECT u.id, u.employee_id, u.name, u.role, u.section_id,
           s.name as section_name, s.code as section_code
    FROM users u
    LEFT JOIN sections s ON u.section_id = s.id
    WHERE u.id = ? AND u.is_active = 1
  `).get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  res.json({ user });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', (req, res) => {
  const { employee_id } = req.body;
  // In a real app, this would send an email/SMS
  console.log(`Password reset requested for: ${employee_id}`);
  res.json({ message: 'If the Employee ID exists, a reset link has been sent to the registered contact.' });
});

module.exports = router;
