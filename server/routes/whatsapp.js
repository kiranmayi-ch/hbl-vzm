const express = require('express');
const router = express.Router();
const { getConnection } = require('../db/connection');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/roleGuard');
const { generatePlantReport, generateSectionReport } = require('../utils/reportGenerator');

// GET /api/whatsapp/plant-report/:monthId
router.get('/plant-report/:monthId', authMiddleware, (req, res) => {
  const db = getConnection();
  const monthId = req.params.monthId;

  const month = db.prepare('SELECT * FROM reporting_months WHERE id = ?').get(monthId);
  if (!month) {
    return res.status(404).json({ error: 'Month not found.' });
  }

  // Get all section data for this month
  const reports = db.prepare(`
    SELECT mr.*, s.name as section_name, s.code as section_code
    FROM monthly_reports mr
    JOIN sections s ON mr.section_id = s.id
    WHERE mr.month_id = ?
    ORDER BY s.display_order
  `).all(monthId);

  const sectionSummaries = reports.map(r => {
    const fiveS = db.prepare('SELECT audit_score FROM module_5s WHERE report_id = ?').get(r.id);
    const am = db.prepare('SELECT closure_pct FROM module_am WHERE report_id = ?').get(r.id);
    const kaizens = db.prepare('SELECT submitted, approved, implemented FROM module_kaizens WHERE report_id = ?').get(r.id);

    return {
      code: r.section_code,
      status: r.status,
      fiveS: fiveS ? fiveS.audit_score : null,
      amClosure: am ? am.closure_pct : 0,
      kaizens: kaizens ? (kaizens.submitted || 0) + (kaizens.approved || 0) + (kaizens.implemented || 0) : 0
    };
  });

  // Quick metrics
  const reportIds = reports.map(r => r.id);
  const placeholders = reportIds.map(() => '?').join(',');

  const avg5S = db.prepare(`SELECT ROUND(AVG(audit_score), 2) as val FROM module_5s WHERE report_id IN (${placeholders})`).get(...reportIds);
  const avgAM = db.prepare(`SELECT ROUND(AVG(closure_pct), 1) as val FROM module_am WHERE report_id IN (${placeholders})`).get(...reportIds);
  const abnData = db.prepare(`SELECT SUM(total) as total, SUM(closed) as closed, SUM(repeated) as repeated FROM module_abnormalities WHERE report_id IN (${placeholders})`).get(...reportIds);
  const kaizenSum = db.prepare(`SELECT SUM(submitted + approved + implemented) as total FROM module_kaizens WHERE report_id IN (${placeholders})`).get(...reportIds);
  const leanSum = db.prepare(`SELECT SUM(qcc + smed + kanban + poka_yoke + vsm + other_lean) as total FROM module_lean_projects WHERE report_id IN (${placeholders})`).get(...reportIds);
  const isoAvg = db.prepare(`SELECT ROUND(AVG(COALESCE(qms_current,0) + COALESCE(ems_current,0) + COALESCE(ohsas_current,0)) / 3, 1) as val FROM module_iso WHERE report_id IN (${placeholders})`).get(...reportIds);

  const metrics = {
    plantScore: 0,
    avg5S: avg5S?.val || 0,
    avgAMClosure: avgAM?.val || 0,
    totalAbnormalities: abnData?.total || 0,
    closedAbnormalities: abnData?.closed || 0,
    repeatedAbnormalities: abnData?.repeated || 0,
    totalKaizens: kaizenSum?.total || 0,
    totalLeanProjects: leanSum?.total || 0,
    avgISO: isoAvg?.val || 0,
    submittedSections: reports.filter(r => r.status === 'submitted').length,
    pendingSections: reports.filter(r => r.status !== 'submitted').length
  };

  const reportText = generatePlantReport(month.label, sectionSummaries, metrics);
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(reportText)}`;

  res.json({ text: reportText, whatsapp_url: whatsappUrl, month: month.label });
});

// GET /api/whatsapp/section-report/:reportId
router.get('/section-report/:reportId', authMiddleware, (req, res) => {
  const db = getConnection();
  const reportId = req.params.reportId;

  const report = db.prepare(`
    SELECT mr.*, s.name as section_name, rm.label as month_label
    FROM monthly_reports mr
    JOIN sections s ON mr.section_id = s.id
    JOIN reporting_months rm ON mr.month_id = rm.id
    WHERE mr.id = ?
  `).get(reportId);

  if (!report) {
    return res.status(404).json({ error: 'Report not found.' });
  }

  // Section users can only share their own section
  if (req.user.role === 'section_user' && report.section_id !== req.user.section_id) {
    return res.status(403).json({ error: 'You can only share your own section report.' });
  }

  const data = {
    module_5s: db.prepare('SELECT * FROM module_5s WHERE report_id = ?').get(reportId),
    module_am: db.prepare('SELECT * FROM module_am WHERE report_id = ?').get(reportId),
    module_abnormalities: db.prepare('SELECT * FROM module_abnormalities WHERE report_id = ?').get(reportId),
    module_avinya: db.prepare('SELECT * FROM module_avinya WHERE report_id = ?').get(reportId),
    module_kaizens: db.prepare('SELECT * FROM module_kaizens WHERE report_id = ?').get(reportId),
    module_lean_projects: db.prepare('SELECT * FROM module_lean_projects WHERE report_id = ?').get(reportId),
    module_process_std: db.prepare('SELECT * FROM module_process_std WHERE report_id = ?').get(reportId),
    module_iso: db.prepare('SELECT * FROM module_iso WHERE report_id = ?').get(reportId)
  };

  const reportText = generateSectionReport(report.section_name, report.month_label, data);
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(reportText)}`;

  res.json({ text: reportText, whatsapp_url: whatsappUrl, section: report.section_name, month: report.month_label });
});

module.exports = router;
