const express = require('express');
const router = express.Router();
const { getConnection } = require('../db/connection');
const authMiddleware = require('../middleware/auth');

// GET /api/trends/:metric?section_id=X - Historical trend for a metric
router.get('/:metric', authMiddleware, (req, res) => {
  const { metric } = req.params;
  const { section_id } = req.query;
  const db = getConnection();

  const months = db.prepare('SELECT * FROM reporting_months ORDER BY year, month').all();

  const trends = [];

  for (const m of months) {
    let sql, data;

    if (section_id) {
      // Single section trend
      const report = db.prepare(
        'SELECT id FROM monthly_reports WHERE month_id = ? AND section_id = ?'
      ).get(m.id, section_id);

      if (!report) { trends.push({ month: m.label, value: null }); continue; }

      switch (metric) {
        case '5s':
          data = db.prepare('SELECT audit_score as value FROM module_5s WHERE report_id = ?').get(report.id);
          break;
        case 'am_closure':
          data = db.prepare('SELECT closure_pct as value FROM module_am WHERE report_id = ?').get(report.id);
          break;
        case 'kaizens':
          data = db.prepare('SELECT (submitted + approved + implemented) as value FROM module_kaizens WHERE report_id = ?').get(report.id);
          break;
        case 'abnormalities':
          data = db.prepare('SELECT total as value FROM module_abnormalities WHERE report_id = ?').get(report.id);
          break;
        case 'repeated_abnormalities':
          data = db.prepare('SELECT repeated as value FROM module_abnormalities WHERE report_id = ?').get(report.id);
          break;
        case 'lean_completion':
          data = db.prepare('SELECT completion_pct as value FROM module_lean_projects WHERE report_id = ?').get(report.id);
          break;
        case 'iso':
          data = db.prepare(`
            SELECT ROUND(COALESCE(
              (COALESCE(qms_current, 0) + COALESCE(ems_current, 0) + COALESCE(ohsas_current, 0)) /
              NULLIF((CASE WHEN qms_current IS NOT NULL THEN 1 ELSE 0 END +
                      CASE WHEN ems_current IS NOT NULL THEN 1 ELSE 0 END +
                      CASE WHEN ohsas_current IS NOT NULL THEN 1 ELSE 0 END), 0)
            , 0), 1) as value FROM module_iso WHERE report_id = ?
          `).get(report.id);
          break;
        case 'process_closure':
          data = db.prepare(`
            SELECT CASE WHEN audit_findings > 0 THEN ROUND(CAST(closed AS REAL) / audit_findings * 100, 1) ELSE 0 END as value
            FROM module_process_std WHERE report_id = ?
          `).get(report.id);
          break;
        default:
          return res.status(400).json({ error: `Unknown metric: ${metric}` });
      }
      trends.push({ month: m.label, month_id: m.id, value: data ? data.value : null });

    } else {
      // Plant-wide average
      const reports = db.prepare('SELECT id FROM monthly_reports WHERE month_id = ?').all(m.id);
      const reportIds = reports.map(r => r.id);

      if (reportIds.length === 0) { trends.push({ month: m.label, value: null }); continue; }

      const placeholders = reportIds.map(() => '?').join(',');

      switch (metric) {
        case '5s':
          data = db.prepare(`SELECT ROUND(AVG(audit_score), 2) as value FROM module_5s WHERE report_id IN (${placeholders})`).get(...reportIds);
          break;
        case 'am_closure':
          data = db.prepare(`SELECT ROUND(AVG(closure_pct), 1) as value FROM module_am WHERE report_id IN (${placeholders})`).get(...reportIds);
          break;
        case 'kaizens':
          data = db.prepare(`SELECT SUM(submitted + approved + implemented) as value FROM module_kaizens WHERE report_id IN (${placeholders})`).get(...reportIds);
          break;
        case 'abnormalities':
          data = db.prepare(`SELECT SUM(total) as value FROM module_abnormalities WHERE report_id IN (${placeholders})`).get(...reportIds);
          break;
        case 'repeated_abnormalities':
          data = db.prepare(`SELECT SUM(repeated) as value FROM module_abnormalities WHERE report_id IN (${placeholders})`).get(...reportIds);
          break;
        case 'lean_completion':
          data = db.prepare(`SELECT ROUND(AVG(completion_pct), 1) as value FROM module_lean_projects WHERE report_id IN (${placeholders})`).get(...reportIds);
          break;
        case 'iso':
          data = db.prepare(`SELECT ROUND(AVG(COALESCE(qms_current,0) + COALESCE(ems_current,0) + COALESCE(ohsas_current,0)) / 3, 1) as value FROM module_iso WHERE report_id IN (${placeholders})`).get(...reportIds);
          break;
        case 'process_closure':
          data = db.prepare(`SELECT CASE WHEN SUM(audit_findings) > 0 THEN ROUND(CAST(SUM(closed) AS REAL) / SUM(audit_findings) * 100, 1) ELSE 0 END as value FROM module_process_std WHERE report_id IN (${placeholders})`).get(...reportIds);
          break;
        case 'submissions':
          const submittedCount = reports.filter(r => {
            const full = db.prepare('SELECT status FROM monthly_reports WHERE id = ?').get(r.id);
            return full && full.status === 'submitted';
          }).length;
          data = { value: Math.round((submittedCount / 13) * 100) };
          break;
        default:
          return res.status(400).json({ error: `Unknown metric: ${metric}` });
      }
      trends.push({ month: m.label, month_id: m.id, value: data ? data.value : null });
    }
  }

  res.json({ metric, section_id: section_id || null, trends });
});

module.exports = router;
