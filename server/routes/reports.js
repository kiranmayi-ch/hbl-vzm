const express = require('express');
const router = express.Router();
const { getConnection } = require('../db/connection');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/roleGuard');

// GET /api/reports - List reports with filters
router.get('/', authMiddleware, (req, res) => {
  const { month_id, section_id, status } = req.query;
  const db = getConnection();

  let sql = `
    SELECT mr.*, s.name as section_name, s.code as section_code,
           rm.label as month_label, rm.month, rm.year,
           u.name as updated_by_name
    FROM monthly_reports mr
    JOIN sections s ON mr.section_id = s.id
    JOIN reporting_months rm ON mr.month_id = rm.id
    LEFT JOIN users u ON mr.updated_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (month_id) { sql += ' AND mr.month_id = ?'; params.push(month_id); }
  if (section_id) { sql += ' AND mr.section_id = ?'; params.push(section_id); }
  if (status) { sql += ' AND mr.status = ?'; params.push(status); }

  sql += ' ORDER BY s.display_order, rm.year DESC, rm.month DESC';

  const reports = db.prepare(sql).all(...params);
  res.json({ reports });
});

// GET /api/reports/:id - Get single report with all module data
router.get('/:id', authMiddleware, (req, res) => {
  const db = getConnection();

  const report = db.prepare(`
    SELECT mr.*, s.name as section_name, s.code as section_code,
           rm.label as month_label, rm.month, rm.year,
           u.name as updated_by_name, su.name as submitted_by_name
    FROM monthly_reports mr
    JOIN sections s ON mr.section_id = s.id
    JOIN reporting_months rm ON mr.month_id = rm.id
    LEFT JOIN users u ON mr.updated_by = u.id
    LEFT JOIN users su ON mr.submitted_by = su.id
    WHERE mr.id = ?
  `).get(req.params.id);

  if (!report) {
    return res.status(404).json({ error: 'Report not found.' });
  }

  // Get all module data
  const modules = {
    module_5s: db.prepare('SELECT * FROM module_5s WHERE report_id = ?').get(req.params.id),
    module_am: db.prepare('SELECT * FROM module_am WHERE report_id = ?').get(req.params.id),
    module_abnormalities: db.prepare('SELECT * FROM module_abnormalities WHERE report_id = ?').get(req.params.id),
    module_avinya: db.prepare('SELECT * FROM module_avinya WHERE report_id = ?').get(req.params.id),
    module_kaizens: db.prepare('SELECT * FROM module_kaizens WHERE report_id = ?').get(req.params.id),
    module_lean_projects: db.prepare('SELECT * FROM module_lean_projects WHERE report_id = ?').get(req.params.id),
    module_process_std: db.prepare('SELECT * FROM module_process_std WHERE report_id = ?').get(req.params.id),
    module_iso: db.prepare('SELECT * FROM module_iso WHERE report_id = ?').get(req.params.id),
    module_opportunities: db.prepare('SELECT * FROM module_opportunities WHERE report_id = ?').get(req.params.id),
    module_high_impact: null
  };

  // Get high impact with items
  const highImpact = db.prepare('SELECT * FROM module_high_impact WHERE report_id = ?').get(req.params.id);
  if (highImpact) {
    highImpact.items = db.prepare('SELECT * FROM high_impact_items WHERE module_id = ?').all(highImpact.id);
    modules.module_high_impact = highImpact;
  }

  res.json({ report, modules });
});

// GET /api/reports/section/:sectionId/month/:monthId - Get report by section+month
router.get('/section/:sectionId/month/:monthId', authMiddleware, (req, res) => {
  const db = getConnection();

  const report = db.prepare(`
    SELECT mr.*, s.name as section_name, s.code as section_code,
           rm.label as month_label, rm.month, rm.year,
           u.name as updated_by_name
    FROM monthly_reports mr
    JOIN sections s ON mr.section_id = s.id
    JOIN reporting_months rm ON mr.month_id = rm.id
    LEFT JOIN users u ON mr.updated_by = u.id
    WHERE mr.section_id = ? AND mr.month_id = ?
  `).get(req.params.sectionId, req.params.monthId);

  if (!report) {
    return res.status(404).json({ error: 'Report not found.' });
  }

  // Redirect to full report endpoint
  const modules = {
    module_5s: db.prepare('SELECT * FROM module_5s WHERE report_id = ?').get(report.id),
    module_am: db.prepare('SELECT * FROM module_am WHERE report_id = ?').get(report.id),
    module_abnormalities: db.prepare('SELECT * FROM module_abnormalities WHERE report_id = ?').get(report.id),
    module_avinya: db.prepare('SELECT * FROM module_avinya WHERE report_id = ?').get(report.id),
    module_kaizens: db.prepare('SELECT * FROM module_kaizens WHERE report_id = ?').get(report.id),
    module_lean_projects: db.prepare('SELECT * FROM module_lean_projects WHERE report_id = ?').get(report.id),
    module_process_std: db.prepare('SELECT * FROM module_process_std WHERE report_id = ?').get(report.id),
    module_iso: db.prepare('SELECT * FROM module_iso WHERE report_id = ?').get(report.id),
    module_opportunities: db.prepare('SELECT * FROM module_opportunities WHERE report_id = ?').get(report.id),
    module_high_impact: null
  };

  const highImpact = db.prepare('SELECT * FROM module_high_impact WHERE report_id = ?').get(report.id);
  if (highImpact) {
    highImpact.items = db.prepare('SELECT * FROM high_impact_items WHERE module_id = ?').all(highImpact.id);
    modules.module_high_impact = highImpact;
  }

  res.json({ report, modules });
});

// PUT /api/reports/:id/submit - Submit report
router.put('/:id/submit', authMiddleware, requireRole('admin', 'section_user'), (req, res) => {
  const db = getConnection();
  const report = db.prepare('SELECT * FROM monthly_reports WHERE id = ?').get(req.params.id);

  if (!report) {
    return res.status(404).json({ error: 'Report not found.' });
  }

  // Section user can only submit their own section
  if (req.user.role === 'section_user' && report.section_id !== req.user.section_id) {
    return res.status(403).json({ error: 'You can only submit your own section report.' });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE monthly_reports SET status = 'submitted', submitted_at = ?, submitted_by = ?, updated_at = ?, updated_by = ?
    WHERE id = ?
  `).run(now, req.user.id, now, req.user.id, req.params.id);

  // Log activity
  db.prepare(
    'INSERT INTO activity_logs (user_id, action, entity, entity_id, details, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.user.id, 'submit', 'report', req.params.id,
    JSON.stringify({ section_id: report.section_id, month_id: report.month_id }), now);

  res.json({ message: 'Report submitted successfully.' });
});

module.exports = router;
