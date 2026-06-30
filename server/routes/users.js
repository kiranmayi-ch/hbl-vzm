const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getConnection } = require('../db/connection');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/roleGuard');

// GET /api/users - List all users (admin only)
router.get('/', authMiddleware, requireRole('admin'), (req, res) => {
  const db = getConnection();
  const users = db.prepare(`
    SELECT u.id, u.employee_id, u.name, u.role, u.section_id, u.is_active,
           u.created_at, u.updated_at,
           s.name as section_name, s.code as section_code
    FROM users u
    LEFT JOIN sections s ON u.section_id = s.id
    ORDER BY u.id
  `).all();

  res.json({ users });
});

// POST /api/users - Create user (admin only)
router.post('/', authMiddleware, requireRole('admin'), (req, res) => {
  const { employee_id, name, password, role, section_id } = req.body;

  if (!employee_id || !name || !password || !role) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (role === 'section_user' && !section_id) {
    return res.status(400).json({ error: 'Section user must be assigned a section.' });
  }

  const db = getConnection();
  const existing = db.prepare('SELECT id FROM users WHERE employee_id = ?').get(employee_id.toUpperCase());
  if (existing) {
    return res.status(409).json({ error: 'Employee ID already exists.' });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (employee_id, name, password_hash, role, section_id) VALUES (?, ?, ?, ?, ?)'
  ).run(employee_id.toUpperCase(), name, password_hash, role, section_id || null);

  // Log activity
  db.prepare(
    'INSERT INTO activity_logs (user_id, action, entity, entity_id, details, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.user.id, 'create_user', 'user', result.lastInsertRowid,
    JSON.stringify({ employee_id, name, role }), new Date().toISOString());

  res.status(201).json({
    message: 'User created successfully.',
    user_id: result.lastInsertRowid
  });
});

// PUT /api/users/:id - Update user (admin only)
router.put('/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const { name, role, section_id, is_active } = req.body;
  const db = getConnection();

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  db.prepare(`
    UPDATE users SET name = COALESCE(?, name), role = COALESCE(?, role),
    section_id = ?, is_active = COALESCE(?, is_active), updated_at = ?
    WHERE id = ?
  `).run(name, role, section_id !== undefined ? section_id : null, is_active, new Date().toISOString(), req.params.id);

  // Log activity
  db.prepare(
    'INSERT INTO activity_logs (user_id, action, entity, entity_id, details, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.user.id, 'update_user', 'user', req.params.id,
    JSON.stringify({ name, role, section_id }), new Date().toISOString());

  res.json({ message: 'User updated successfully.' });
});

// PUT /api/users/me/password - Change own password
router.put('/me/password', authMiddleware, (req, res) => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password || new_password.length < 6) {
    return res.status(400).json({ error: 'Valid current password and a new password (min 6 characters) are required.' });
  }

  const db = getConnection();
  const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
  
  if (!user || !bcrypt.compareSync(current_password, user.password_hash)) {
    return res.status(401).json({ error: 'Incorrect current password.' });
  }

  const password_hash = bcrypt.hashSync(new_password, 10);
  db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
    .run(password_hash, new Date().toISOString(), req.user.id);

  db.prepare(
    'INSERT INTO activity_logs (user_id, action, entity, entity_id, details, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.user.id, 'change_password', 'user', req.user.id,
    JSON.stringify({}), new Date().toISOString());

  res.json({ message: 'Password changed successfully.' });
});

// PUT /api/users/:id/reset-password - Reset password (admin only)
router.put('/:id/reset-password', authMiddleware, requireRole('admin'), (req, res) => {
  const { new_password } = req.body;

  if (!new_password || new_password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const db = getConnection();
  const password_hash = bcrypt.hashSync(new_password, 10);

  db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
    .run(password_hash, new Date().toISOString(), req.params.id);

  // Log activity
  db.prepare(
    'INSERT INTO activity_logs (user_id, action, entity, entity_id, details, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.user.id, 'reset_password', 'user', req.params.id,
    JSON.stringify({ target_user_id: req.params.id }), new Date().toISOString());

  res.json({ message: 'Password reset successfully.' });
});

// DELETE /api/users/:id - Deactivate user (admin only)
router.delete('/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const db = getConnection();
  db.prepare('UPDATE users SET is_active = 0, updated_at = ? WHERE id = ?')
    .run(new Date().toISOString(), req.params.id);

  res.json({ message: 'User deactivated successfully.' });
});

module.exports = router;
