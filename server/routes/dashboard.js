const express = require('express');
const router = express.Router();
const { getConnection } = require('../db/connection');
const authMiddleware = require('../middleware/auth');
const { calcPlantScore, calcAvg5S, calcSubmissionPct } = require('../utils/calculations');

// GET /api/dashboard?month_id=X - Aggregated plant-wide metrics
router.get('/', authMiddleware, (req, res) => {
  const db = getConnection();
  let { month_id } = req.query;

  // Default to current month (June 2026 = month_id 3)
  if (!month_id) {
    const current = db.prepare(
      "SELECT id FROM reporting_months WHERE month = ? AND year = ?"
    ).get(new Date().getMonth() + 1, new Date().getFullYear());
    month_id = current ? current.id : 3;
  }

  const monthInfo = db.prepare('SELECT * FROM reporting_months WHERE id = ?').get(month_id);

  // Get all reports for this month
  const reports = db.prepare(`
    SELECT mr.*, s.name as section_name, s.code as section_code
    FROM monthly_reports mr
    JOIN sections s ON mr.section_id = s.id
    WHERE mr.month_id = ?
    ORDER BY s.display_order
  `).all(month_id);

  const reportIds = reports.map(r => r.id);
  const submittedCount = reports.filter(r => r.status === 'submitted').length;
  const pendingCount = reports.filter(r => r.status !== 'submitted').length;

  // Aggregate 5S
  const fiveSData = db.prepare(`
    SELECT audit_score FROM module_5s WHERE report_id IN (${reportIds.map(() => '?').join(',')})
  `).all(...reportIds);
  const avg5S = calcAvg5S(fiveSData.map(d => d.audit_score));

  // Aggregate AM
  const amData = db.prepare(`
    SELECT closure_pct FROM module_am WHERE report_id IN (${reportIds.map(() => '?').join(',')})
  `).all(...reportIds);
  const avgAMClosure = amData.length > 0
    ? parseFloat((amData.reduce((sum, d) => sum + (d.closure_pct || 0), 0) / amData.length).toFixed(1))
    : 0;

  // Aggregate Kaizens
  const kaizenData = db.prepare(`
    SELECT submitted, approved, implemented, savings FROM module_kaizens WHERE report_id IN (${reportIds.map(() => '?').join(',')})
  `).all(...reportIds);
  const totalKaizens = kaizenData.reduce((sum, d) => sum + (d.submitted || 0) + (d.approved || 0) + (d.implemented || 0), 0);
  const totalKaizenSavings = kaizenData.reduce((sum, d) => sum + (d.savings || 0), 0);

  // Aggregate Lean Projects
  const leanData = db.prepare(`
    SELECT qcc, smed, kanban, poka_yoke, vsm, other_lean, completion_pct FROM module_lean_projects WHERE report_id IN (${reportIds.map(() => '?').join(',')})
  `).all(...reportIds);
  const totalLeanProjects = leanData.reduce((sum, d) => sum + (d.qcc || 0) + (d.smed || 0) + (d.kanban || 0) + (d.poka_yoke || 0) + (d.vsm || 0) + (d.other_lean || 0), 0);
  const avgLeanCompletion = leanData.length > 0
    ? parseFloat((leanData.reduce((sum, d) => sum + (d.completion_pct || 0), 0) / leanData.length).toFixed(1))
    : 0;

  // Aggregate Abnormalities
  const abnData = db.prepare(`
    SELECT total, closed, pending, repeated FROM module_abnormalities WHERE report_id IN (${reportIds.map(() => '?').join(',')})
  `).all(...reportIds);
  const totalAbnormalities = abnData.reduce((sum, d) => sum + (d.total || 0), 0);
  const closedAbnormalities = abnData.reduce((sum, d) => sum + (d.closed || 0), 0);
  const repeatedAbnormalities = abnData.reduce((sum, d) => sum + (d.repeated || 0), 0);
  const avgAbnormalityClosure = totalAbnormalities > 0
    ? parseFloat(((closedAbnormalities / totalAbnormalities) * 100).toFixed(1))
    : 0;

  // Aggregate ISO
  const isoData = db.prepare(`
    SELECT qms_current, ems_current, ohsas_current FROM module_iso WHERE report_id IN (${reportIds.map(() => '?').join(',')})
  `).all(...reportIds);
  const avgISO = isoData.length > 0
    ? parseFloat((isoData.reduce((sum, d) => {
        const vals = [d.qms_current, d.ems_current, d.ohsas_current].filter(v => v !== null);
        return sum + (vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0);
      }, 0) / isoData.length).toFixed(1))
    : 0;

  // Aggregate Process Std
  const processData = db.prepare(`
    SELECT audit_findings, closed FROM module_process_std WHERE report_id IN (${reportIds.map(() => '?').join(',')})
  `).all(...reportIds);
  const totalFindings = processData.reduce((sum, d) => sum + (d.audit_findings || 0), 0);
  const closedFindings = processData.reduce((sum, d) => sum + (d.closed || 0), 0);
  const avgProcessClosure = totalFindings > 0
    ? parseFloat(((closedFindings / totalFindings) * 100).toFixed(1))
    : 0;

  // Aggregate Opportunities
  const oppData = db.prepare(`
    SELECT digitalisation, automation, development FROM module_opportunities WHERE report_id IN (${reportIds.map(() => '?').join(',')})
  `).all(...reportIds);
  const digitalisationCount = oppData.filter(d => d.digitalisation && d.digitalisation.trim()).length;
  const automationCount = oppData.filter(d => d.automation && d.automation.trim()).length;

  // Aggregate High Impact
  const hiCount = db.prepare(`
    SELECT COUNT(*) as cnt FROM high_impact_items hi
    JOIN module_high_impact mhi ON hi.module_id = mhi.id
    WHERE mhi.report_id IN (${reportIds.map(() => '?').join(',')})
  `).get(...reportIds);

  // Calculate plant score
  const plantScore = calcPlantScore({
    avg5S,
    avgAMClosure,
    avgAbnormalityClosure,
    totalKaizens,
    avgLeanCompletion,
    avgISO,
    avgProcessClosure,
    totalOpportunities: digitalisationCount + automationCount
  });

  res.json({
    month: monthInfo,
    metrics: {
      plantScore,
      avg5S,
      avgAMClosure,
      totalKaizens,
      totalKaizenSavings,
      totalLeanProjects,
      avgLeanCompletion,
      totalAbnormalities,
      closedAbnormalities,
      repeatedAbnormalities,
      avgAbnormalityClosure,
      avgISO,
      avgProcessClosure,
      digitalisationCount,
      automationCount,
      highImpactCount: hiCount.cnt,
      submittedSections: submittedCount,
      pendingSections: pendingCount,
      submissionPct: calcSubmissionPct(submittedCount, 13)
    },
    sections: reports.map(r => ({
      id: r.id,
      section_id: r.section_id,
      section_name: r.section_name,
      section_code: r.section_code,
      status: r.status,
      updated_at: r.updated_at
    }))
  });
});

module.exports = router;
