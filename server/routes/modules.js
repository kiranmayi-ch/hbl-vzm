const express = require('express');
const router = express.Router();
const { getConnection } = require('../db/connection');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/roleGuard');
const { calcAMClosure, calcAbnormalityTotal, calcAbnormalityClosure } = require('../utils/calculations');

const MODULE_TABLES = {
  '5s': 'module_5s',
  'am': 'module_am',
  'abnormalities': 'module_abnormalities',
  'avinya': 'module_avinya',
  'kaizens': 'module_kaizens',
  'lean_projects': 'module_lean_projects',
  'process_std': 'module_process_std',
  'iso': 'module_iso',
  'opportunities': 'module_opportunities',
  'high_impact': 'module_high_impact'
};

// GET /api/modules/:reportId - Get all module data for a report
router.get('/:reportId', authMiddleware, (req, res) => {
  const db = getConnection();
  const reportId = req.params.reportId;

  const modules = {};
  for (const [key, table] of Object.entries(MODULE_TABLES)) {
    modules[key] = db.prepare(`SELECT * FROM ${table} WHERE report_id = ?`).get(reportId);
  }

  // Get high impact items
  if (modules.high_impact) {
    modules.high_impact.items = db.prepare(
      'SELECT * FROM high_impact_items WHERE module_id = ?'
    ).all(modules.high_impact.id);
  }

  res.json({ modules });
});

// PUT /api/modules/:reportId/:moduleName - Update specific module data
router.put('/:reportId/:moduleName', authMiddleware, requireRole('admin', 'section_user'), (req, res) => {
  const { reportId, moduleName } = req.params;
  const db = getConnection();

  // Check report ownership for section users
  const report = db.prepare('SELECT * FROM monthly_reports WHERE id = ?').get(reportId);
  if (!report) {
    return res.status(404).json({ error: 'Report not found.' });
  }

  if (req.user.role === 'section_user' && report.section_id !== req.user.section_id) {
    return res.status(403).json({ error: 'You can only edit your own section.' });
  }

  const data = req.body;

  switch (moduleName) {
    case '5s': {
      db.prepare(`
        UPDATE module_5s SET audit_score = ?, target = ?, actual = ?, remarks = ?, file_path = COALESCE(?, file_path)
        WHERE report_id = ?
      `).run(data.audit_score, data.target, data.actual, data.remarks, data.file_path, reportId);
      break;
    }
    case 'am': {
      const closure = calcAMClosure(data.clri_target, data.clri_completed);
      const pending = (data.clri_target || 0) - (data.clri_completed || 0);
      db.prepare(`
        UPDATE module_am SET clri_target = ?, clri_completed = ?, clri_pending = ?, closure_pct = ?, remarks = ?
        WHERE report_id = ?
      `).run(data.clri_target, data.clri_completed, pending, closure, data.remarks, reportId);
      break;
    }
    case 'abnormalities': {
      const total = calcAbnormalityTotal(data.white_tags, data.red_tags);
      const pending = total - (data.closed || 0);
      db.prepare(`
        UPDATE module_abnormalities SET white_tags = ?, red_tags = ?, total = ?, closed = ?, pending = ?,
        repeated = ?, capa_status = ?, remarks = ?
        WHERE report_id = ?
      `).run(data.white_tags, data.red_tags, total, data.closed, pending, data.repeated, data.capa_status, data.remarks, reportId);
      break;
    }
    case 'avinya': {
      const pending = (data.observations_posted || 0) - (data.closed || 0);
      db.prepare(`
        UPDATE module_avinya SET observations_posted = ?, closed = ?, pending = ?, remarks = ?
        WHERE report_id = ?
      `).run(data.observations_posted, data.closed, pending, data.remarks, reportId);
      break;
    }
    case 'kaizens': {
      db.prepare(`
        UPDATE module_kaizens SET submitted = ?, approved = ?, implemented = ?, savings = ?, remarks = ?
        WHERE report_id = ?
      `).run(data.submitted, data.approved, data.implemented, data.savings, data.remarks, reportId);
      break;
    }
    case 'lean_projects': {
      db.prepare(`
        UPDATE module_lean_projects SET qcc = ?, smed = ?, kanban = ?, poka_yoke = ?, vsm = ?,
        other_lean = ?, status = ?, completion_pct = ?
        WHERE report_id = ?
      `).run(data.qcc, data.smed, data.kanban, data.poka_yoke, data.vsm, data.other_lean, data.status, data.completion_pct, reportId);
      break;
    }
    case 'process_std': {
      const pending = (data.audit_findings || 0) - (data.closed || 0);
      db.prepare(`
        UPDATE module_process_std SET audit_findings = ?, closed = ?, pending = ?, remarks = ?
        WHERE report_id = ?
      `).run(data.audit_findings, data.closed, pending, data.remarks, reportId);
      break;
    }
    case 'iso': {
      db.prepare(`
        UPDATE module_iso SET qms_target = ?, qms_current = ?, qms_status = ?,
        ems_target = ?, ems_current = ?, ems_status = ?,
        ohsas_target = ?, ohsas_current = ?, ohsas_status = ?, remarks = ?
        WHERE report_id = ?
      `).run(data.qms_target, data.qms_current, data.qms_status,
        data.ems_target, data.ems_current, data.ems_status,
        data.ohsas_target, data.ohsas_current, data.ohsas_status, data.remarks, reportId);
      break;
    }
    case 'opportunities': {
      db.prepare(`
        UPDATE module_opportunities SET development = ?, digitalisation = ?, automation = ?,
        suggestions = ?, priority = ?
        WHERE report_id = ?
      `).run(data.development, data.digitalisation, data.automation, data.suggestions, data.priority, reportId);
      break;
    }
    case 'high_impact': {
      // Get the module record
      const hiModule = db.prepare('SELECT id FROM module_high_impact WHERE report_id = ?').get(reportId);
      if (hiModule && data.items) {
        // Delete existing items and re-insert
        db.prepare('DELETE FROM high_impact_items WHERE module_id = ?').run(hiModule.id);
        const insertItem = db.prepare(`
          INSERT INTO high_impact_items (module_id, project_name, description, owner, status, savings, completion_pct, target_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const item of data.items) {
          insertItem.run(hiModule.id, item.project_name, item.description, item.owner,
            item.status, item.savings, item.completion_pct, item.target_date);
        }
      }
      break;
    }
    default:
      return res.status(400).json({ error: `Unknown module: ${moduleName}` });
  }

  // Update report timestamp
  db.prepare('UPDATE monthly_reports SET updated_at = ?, updated_by = ? WHERE id = ?')
    .run(new Date().toISOString(), req.user.id, reportId);

  // Log activity
  db.prepare(
    'INSERT INTO activity_logs (user_id, action, entity, entity_id, details, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.user.id, 'update_module', 'report', reportId,
    JSON.stringify({ module: moduleName }), new Date().toISOString());

  res.json({ message: `Module ${moduleName} updated successfully.` });
});

module.exports = router;
