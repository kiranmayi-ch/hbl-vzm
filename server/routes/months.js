const express = require('express');
const router = express.Router();
const { getConnection } = require('../db/connection');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/roleGuard');

// GET /api/months - List all reporting months
router.get('/', authMiddleware, (req, res) => {
  const db = getConnection();
  const months = db.prepare(`
    SELECT rm.*, u.name as created_by_name
    FROM reporting_months rm
    LEFT JOIN users u ON rm.created_by = u.id
    ORDER BY rm.year DESC, rm.month DESC
  `).all();
  res.json({ months });
});

// POST /api/months - Create next month (admin only)
router.post('/', authMiddleware, requireRole('admin'), (req, res) => {
  const db = getConnection();

  // Find the latest month
  const latest = db.prepare(
    'SELECT * FROM reporting_months ORDER BY year DESC, month DESC LIMIT 1'
  ).get();

  let nextMonth, nextYear;
  if (latest) {
    nextMonth = latest.month === 12 ? 1 : latest.month + 1;
    nextYear = latest.month === 12 ? latest.year + 1 : latest.year;
  } else {
    nextMonth = new Date().getMonth() + 1;
    nextYear = new Date().getFullYear();
  }

  const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const label = `${monthNames[nextMonth]} ${nextYear}`;

  // Check if already exists
  const existing = db.prepare(
    'SELECT id FROM reporting_months WHERE month = ? AND year = ?'
  ).get(nextMonth, nextYear);

  if (existing) {
    return res.status(409).json({ error: `${label} already exists.` });
  }

  const result = db.prepare(
    'INSERT INTO reporting_months (month, year, label, status, created_by) VALUES (?, ?, ?, ?, ?)'
  ).run(nextMonth, nextYear, label, 'open', req.user.id);

  const monthId = result.lastInsertRowid;

  // Create monthly reports for all 13 sections
  const sections = db.prepare('SELECT id FROM sections ORDER BY display_order').all();
  const insertReport = db.prepare(
    'INSERT INTO monthly_reports (section_id, month_id, status) VALUES (?, ?, ?)'
  );

  // Also create empty module records
  const insert5S = db.prepare('INSERT INTO module_5s (report_id, target) VALUES (?, 4.5)');
  const insertAM = db.prepare('INSERT INTO module_am (report_id, clri_target, clri_completed, clri_pending, closure_pct) VALUES (?, 30, 0, 0, 0)');
  const insertAbnormalities = db.prepare('INSERT INTO module_abnormalities (report_id) VALUES (?)');
  const insertAvinya = db.prepare('INSERT INTO module_avinya (report_id) VALUES (?)');
  const insertKaizens = db.prepare('INSERT INTO module_kaizens (report_id) VALUES (?)');
  const insertLean = db.prepare('INSERT INTO module_lean_projects (report_id, status, completion_pct) VALUES (?, ?, 0)');
  const insertProcessStd = db.prepare('INSERT INTO module_process_std (report_id) VALUES (?)');
  const insertISO = db.prepare('INSERT INTO module_iso (report_id, qms_target, ems_target, ohsas_target) VALUES (?, 95, 90, 92)');
  const insertOpportunities = db.prepare('INSERT INTO module_opportunities (report_id) VALUES (?)');
  const insertHighImpact = db.prepare('INSERT INTO module_high_impact (report_id) VALUES (?)');

  for (const section of sections) {
    const reportResult = insertReport.run(section.id, monthId, 'draft');
    const reportId = reportResult.lastInsertRowid;

    insert5S.run(reportId);
    insertAM.run(reportId);
    insertAbnormalities.run(reportId);
    insertAvinya.run(reportId);
    insertKaizens.run(reportId);
    insertLean.run(reportId, 'Not Started');
    insertProcessStd.run(reportId);
    insertISO.run(reportId);
    insertOpportunities.run(reportId);
    insertHighImpact.run(reportId);
  }

  // Log activity
  db.prepare(
    'INSERT INTO activity_logs (user_id, action, entity, entity_id, details, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.user.id, 'create_month', 'month', monthId, JSON.stringify({ label }), new Date().toISOString());

  res.status(201).json({ message: `${label} created successfully.`, month_id: monthId });
});

// PUT /api/months/:id - Update month status (admin only)
router.put('/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const { status } = req.body;
  const db = getConnection();

  db.prepare('UPDATE reporting_months SET status = ? WHERE id = ?').run(status, req.params.id);

  res.json({ message: 'Month updated successfully.' });
});

module.exports = router;
