const { getConnection } = require('./connection');
const { createTables } = require('./schema');
const bcrypt = require('bcryptjs');

function seed() {
  const db = getConnection();
  createTables();

  // Clear existing data
  db.exec(`
    DELETE FROM high_impact_items;
    DELETE FROM module_high_impact;
    DELETE FROM module_opportunities;
    DELETE FROM module_iso;
    DELETE FROM module_process_std;
    DELETE FROM module_lean_projects;
    DELETE FROM module_kaizens;
    DELETE FROM module_avinya;
    DELETE FROM module_abnormalities;
    DELETE FROM module_am;
    DELETE FROM module_5s;
    DELETE FROM uploads;
    DELETE FROM activity_logs;
    DELETE FROM monthly_reports;
    DELETE FROM reporting_months;
    DELETE FROM users;
    DELETE FROM sections;
  `);

  // ═══════════════════════════════════════════
  // 1. SECTIONS (13 predefined)
  // ═══════════════════════════════════════════
  const sections = [
    { name: 'Plastic Molding Division', code: 'PMD', order: 1 },
    { name: 'Material Component Division', code: 'MCD', order: 2 },
    { name: 'Battery Recycling & Alloying Unit', code: 'BRAU', order: 3 },
    { name: 'Grid Casting', code: 'GC', order: 4 },
    { name: 'LSO', code: 'LSO', order: 5 },
    { name: 'Pasting', code: 'PASTING', order: 6 },
    { name: 'C&D', code: 'CD', order: 7 },
    { name: 'Buffing / Plate Shop', code: 'BPS', order: 8 },
    { name: 'Cell Assembly', code: 'CA', order: 9 },
    { name: 'Small UPS', code: 'SUPS', order: 10 },
    { name: 'Big UPS', code: 'BUPS', order: 11 },
    { name: 'Formation (FSF)', code: 'FSF', order: 12 },
    { name: 'Battery Assembly', code: 'BA', order: 13 },
  ];

  const insertSection = db.prepare(
    'INSERT INTO sections (name, code, display_order) VALUES (?, ?, ?)'
  );
  for (const s of sections) {
    insertSection.run(s.name, s.code, s.order);
  }
  console.log('✅ 13 sections seeded');

  // ═══════════════════════════════════════════
  // 2. USERS (3 default)
  // ═══════════════════════════════════════════
  const passwordHash = bcrypt.hashSync('admin123', 10);

  const insertUser = db.prepare(
    'INSERT INTO users (employee_id, name, password_hash, role, section_id) VALUES (?, ?, ?, ?, ?)'
  );

  insertUser.run('ADMIN001', 'Plant Administrator', passwordHash, 'admin', null);
  insertUser.run('PMD001', 'Rajesh Kumar', passwordHash, 'section_user', 1);
  insertUser.run('VIEWER001', 'Plant Head', passwordHash, 'viewer', null);

  // Create section users for all sections
  const sectionUsers = [
    // PMD001 already created above for section 1
    { empId: 'MCD001', name: 'Suresh Patel', sectionId: 2 },
    { empId: 'BRAU001', name: 'Anil Sharma', sectionId: 3 },
    { empId: 'GC001', name: 'Vikram Singh', sectionId: 4 },
    { empId: 'LSO001', name: 'Pradeep Verma', sectionId: 5 },
    { empId: 'PAST001', name: 'Manoj Gupta', sectionId: 6 },
    { empId: 'CD001', name: 'Ravi Tiwari', sectionId: 7 },
    { empId: 'BPS001', name: 'Deepak Yadav', sectionId: 8 },
    { empId: 'CA001', name: 'Santosh Mishra', sectionId: 9 },
    { empId: 'SUPS001', name: 'Ajay Pandey', sectionId: 10 },
    { empId: 'BUPS001', name: 'Rahul Joshi', sectionId: 11 },
    { empId: 'FSF001', name: 'Amit Saxena', sectionId: 12 },
    { empId: 'BA001', name: 'Karan Mehta', sectionId: 13 },
  ];

  for (const u of sectionUsers) {
    insertUser.run(u.empId, u.name, passwordHash, 'section_user', u.sectionId);
  }

  console.log('✅ 15 users seeded (1 admin, 13 section users, 1 viewer)');

  // ═══════════════════════════════════════════
  // 3. REPORTING MONTHS (April - September 2026)
  // ═══════════════════════════════════════════
  const months = [
    { month: 4, year: 2026, label: 'April 2026' },
    { month: 5, year: 2026, label: 'May 2026' },
    { month: 6, year: 2026, label: 'June 2026' },
    { month: 7, year: 2026, label: 'July 2026' },
    { month: 8, year: 2026, label: 'August 2026' },
    { month: 9, year: 2026, label: 'September 2026' },
  ];

  const insertMonth = db.prepare(
    'INSERT INTO reporting_months (month, year, label, status, created_by) VALUES (?, ?, ?, ?, ?)'
  );
  for (const m of months) {
    insertMonth.run(m.month, m.year, m.label, 'open', 1);
  }
  console.log('✅ 6 reporting months seeded (April-September 2026)');

  // ═══════════════════════════════════════════
  // 4. MONTHLY REPORTS (13 sections × 6 months = 78)
  // ═══════════════════════════════════════════
  const insertReport = db.prepare(
    'INSERT INTO monthly_reports (section_id, month_id, status, submitted_at, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?)'
  );

  const reportIds = {};

  for (let monthIdx = 1; monthIdx <= 6; monthIdx++) {
    for (let sectionIdx = 1; sectionIdx <= 13; sectionIdx++) {
      const isHistorical = monthIdx <= 3; // April, May, June = submitted
      const status = isHistorical ? 'submitted' : 'draft';
      const submittedAt = isHistorical ? `2026-0${monthIdx + 3}-28T18:00:00Z` : null;
      const updatedAt = isHistorical
        ? `2026-0${monthIdx + 3}-28T18:00:00Z`
        : `2026-0${monthIdx + 3}-15T10:00:00Z`;

      const result = insertReport.run(
        sectionIdx, monthIdx, status, submittedAt, updatedAt, sectionIdx + 1
      );
      reportIds[`${sectionIdx}-${monthIdx}`] = result.lastInsertRowid;
    }
  }
  console.log('✅ 78 monthly reports seeded');

  // ═══════════════════════════════════════════
  // 5. MODULE DATA - Seed with realistic values
  // ═══════════════════════════════════════════

  // Helper: random number in range
  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function randFloat(min, max, decimals = 1) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
  }

  // Prepare all module inserts
  const insert5S = db.prepare(
    'INSERT INTO module_5s (report_id, audit_score, target, actual, remarks) VALUES (?, ?, ?, ?, ?)'
  );
  const insertAM = db.prepare(
    'INSERT INTO module_am (report_id, clri_target, clri_completed, clri_pending, closure_pct, remarks) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertAbnormalities = db.prepare(
    'INSERT INTO module_abnormalities (report_id, white_tags, red_tags, total, closed, pending, repeated, capa_status, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const insertAvinya = db.prepare(
    'INSERT INTO module_avinya (report_id, observations_posted, closed, pending, remarks) VALUES (?, ?, ?, ?, ?)'
  );
  const insertKaizens = db.prepare(
    'INSERT INTO module_kaizens (report_id, submitted, approved, implemented, savings, remarks) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertLean = db.prepare(
    'INSERT INTO module_lean_projects (report_id, qcc, smed, kanban, poka_yoke, vsm, other_lean, status, completion_pct) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const insertProcessStd = db.prepare(
    'INSERT INTO module_process_std (report_id, audit_findings, closed, pending, remarks) VALUES (?, ?, ?, ?, ?)'
  );
  const insertISO = db.prepare(
    'INSERT INTO module_iso (report_id, qms_target, qms_current, qms_status, ems_target, ems_current, ems_status, ohsas_target, ohsas_current, ohsas_status, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const insertOpportunities = db.prepare(
    'INSERT INTO module_opportunities (report_id, development, digitalisation, automation, suggestions, priority) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertHighImpact = db.prepare(
    'INSERT INTO module_high_impact (report_id) VALUES (?)'
  );
  const insertHighImpactItem = db.prepare(
    'INSERT INTO high_impact_items (module_id, project_name, description, owner, status, savings, completion_pct, target_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const capaStatuses = ['Open', 'In Progress', 'Closed', 'Verified'];
  const isoStatuses = ['On Track', 'At Risk', 'Behind', 'Achieved'];
  const leanStatuses = ['Not Started', 'In Progress', 'Completed', 'On Hold'];
  const priorities = ['High', 'Medium', 'Low'];
  const hiStatuses = ['Planning', 'In Progress', 'Completed', 'On Hold'];

  const developmentIdeas = [
    'New polymer formulation R&D',
    'Electrode thickness optimization',
    'Advanced grid alloy development',
    'Separator material evaluation',
    'Electrolyte composition study',
    'Terminal post design improvement',
    'Container design enhancement',
    'Paste density optimization',
    'Formation profile optimization',
    'Curing cycle improvement',
    'Acid mixing automation',
    'Plate weight consistency study',
    'Grid weight variation reduction',
  ];

  const digitalisationIdeas = [
    'Barcode tracking system',
    'IoT sensor integration',
    'Digital SPC charts',
    'Automated data collection',
    'OEE monitoring dashboard',
    'Digital work instructions',
    'QR-based material tracking',
    'Paperless inspection system',
    'Machine learning for defect detection',
    'Real-time production monitoring',
    'Digital maintenance log',
    'Automated report generation',
    'Smart inventory management',
  ];

  const automationIdeas = [
    'Robotic palletizing',
    'Automated plate feeding',
    'Auto stacking system',
    'Conveyor integration',
    'Auto acid filling',
    'Automated visual inspection',
    'PLC-based process control',
    'Automated packaging line',
    'Auto welding system',
    'Robotic material handling',
    'Automated testing station',
    'Auto labeling machine',
    'Servo-driven enveloping',
  ];

  const highImpactProjects = [
    { name: 'Zero Defect Initiative', desc: 'Implement poka-yoke across assembly line' },
    { name: 'Energy Saving Project', desc: 'LED conversion and VFD installation' },
    { name: 'Cycle Time Reduction', desc: 'Bottleneck elimination in critical processes' },
    { name: 'Scrap Reduction Program', desc: 'Root cause analysis and countermeasures' },
    { name: 'OEE Improvement', desc: 'Target 85% OEE across all machines' },
    { name: 'Inventory Optimization', desc: 'JIT implementation for raw materials' },
    { name: 'Safety Enhancement', desc: 'Machine guarding and PPE compliance' },
    { name: 'Quality Circle Project', desc: 'Cross-functional team improvement' },
    { name: 'TPM Implementation', desc: 'Total productive maintenance rollout' },
    { name: 'Layout Optimization', desc: 'Material flow improvement and 5S' },
    { name: 'Supplier Development', desc: 'Quality improvement at supplier end' },
    { name: 'Skill Matrix Development', desc: 'Multi-skilling and cross-training' },
    { name: 'Water Conservation', desc: 'Recycling and reuse of process water' },
  ];

  const owners = [
    'Rajesh K.', 'Suresh P.', 'Anil S.', 'Vikram S.', 'Pradeep V.',
    'Manoj G.', 'Ravi T.', 'Deepak Y.', 'Santosh M.', 'Ajay P.',
    'Rahul J.', 'Amit S.', 'Karan M.',
  ];

  // Seed module data for each report
  for (let monthIdx = 1; monthIdx <= 6; monthIdx++) {
    const isHistorical = monthIdx <= 3;

    for (let sectionIdx = 1; sectionIdx <= 13; sectionIdx++) {
      const reportId = reportIds[`${sectionIdx}-${monthIdx}`];

      if (isHistorical) {
        // Full data for historical months
        const baseScore = randFloat(3.0, 4.8);
        const progressFactor = monthIdx * 0.05; // slight improvement each month

        // 5S
        const target5S = 4.5;
        const actual5S = Math.min(5.0, baseScore + progressFactor);
        insert5S.run(reportId, actual5S, target5S, actual5S, `5S audit completed. Score: ${actual5S}`);

        // AM
        const amTarget = rand(20, 40);
        const amCompleted = rand(Math.floor(amTarget * 0.6), amTarget);
        const amPending = amTarget - amCompleted;
        const amClosure = parseFloat(((amCompleted / amTarget) * 100).toFixed(1));
        insertAM.run(reportId, amTarget, amCompleted, amPending, amClosure, 'CLRI activities progressing well');

        // Abnormalities
        const whiteTags = rand(5, 20);
        const redTags = rand(2, 8);
        const totalTags = whiteTags + redTags;
        const closedTags = rand(Math.floor(totalTags * 0.5), totalTags);
        const pendingTags = totalTags - closedTags;
        const repeatedTags = rand(0, 3);
        insertAbnormalities.run(reportId, whiteTags, redTags, totalTags, closedTags, pendingTags, repeatedTags,
          capaStatuses[rand(0, 3)], 'Regular tag tracking in progress');

        // Avinya
        const avinyaPosted = rand(5, 15);
        const avinyaClosed = rand(Math.floor(avinyaPosted * 0.5), avinyaPosted);
        insertAvinya.run(reportId, avinyaPosted, avinyaClosed, avinyaPosted - avinyaClosed, 'Observations being addressed');

        // Kaizens
        const kaizenSubmitted = rand(3, 12);
        const kaizenApproved = rand(Math.floor(kaizenSubmitted * 0.5), kaizenSubmitted);
        const kaizenImplemented = rand(Math.floor(kaizenApproved * 0.3), kaizenApproved);
        const kaizenSavings = randFloat(10000, 200000, 0);
        insertKaizens.run(reportId, kaizenSubmitted, kaizenApproved, kaizenImplemented, kaizenSavings, 'Good kaizen activity this month');

        // Lean Projects
        insertLean.run(reportId, rand(0, 2), rand(0, 2), rand(0, 2), rand(0, 3), rand(0, 1), rand(0, 2),
          leanStatuses[rand(0, 3)], randFloat(20, 95));

        // Process Standardisation
        const auditFindings = rand(5, 15);
        const findingsClosed = rand(Math.floor(auditFindings * 0.5), auditFindings);
        insertProcessStd.run(reportId, auditFindings, findingsClosed, auditFindings - findingsClosed, 'Audit findings being addressed');

        // ISO
        const qmsTarget = 95;
        const emsTarget = 90;
        const ohsasTarget = 92;
        insertISO.run(reportId,
          qmsTarget, randFloat(85, 98), isoStatuses[rand(0, 3)],
          emsTarget, randFloat(80, 95), isoStatuses[rand(0, 3)],
          ohsasTarget, randFloat(82, 96), isoStatuses[rand(0, 3)],
          'ISO objectives tracking in progress'
        );

        // Opportunities
        insertOpportunities.run(reportId,
          developmentIdeas[sectionIdx - 1],
          digitalisationIdeas[sectionIdx - 1],
          automationIdeas[sectionIdx - 1],
          `Suggestion for ${sections[sectionIdx - 1].name}`,
          priorities[rand(0, 2)]
        );

        // High Impact Projects
        const hiResult = insertHighImpact.run(reportId);
        const hiModuleId = hiResult.lastInsertRowid;
        const numProjects = rand(1, 3);
        for (let p = 0; p < numProjects; p++) {
          const proj = highImpactProjects[(sectionIdx + p) % highImpactProjects.length];
          insertHighImpactItem.run(hiModuleId,
            proj.name, proj.desc, owners[sectionIdx - 1],
            hiStatuses[rand(0, 3)], randFloat(50000, 500000, 0),
            randFloat(10, 100), `2026-${String(rand(7, 12)).padStart(2, '0')}-${String(rand(1, 28)).padStart(2, '0')}`
          );
        }

      } else {
        // Partial/empty data for future months (July, Aug, Sep)
        insert5S.run(reportId, null, 4.5, null, null);
        insertAM.run(reportId, rand(25, 40), 0, null, 0, null);
        insertAbnormalities.run(reportId, 0, 0, 0, 0, 0, 0, null, null);
        insertAvinya.run(reportId, 0, 0, 0, null);
        insertKaizens.run(reportId, 0, 0, 0, 0, null);
        insertLean.run(reportId, 0, 0, 0, 0, 0, 0, 'Not Started', 0);
        insertProcessStd.run(reportId, 0, 0, 0, null);
        insertISO.run(reportId, 95, null, null, 90, null, null, 92, null, null, null);
        insertOpportunities.run(reportId, null, null, null, null, null);
        const hiResult = insertHighImpact.run(reportId);
        // No items for future months
      }
    }
  }

  console.log('✅ All module data seeded for 78 reports');

  // ═══════════════════════════════════════════
  // 6. SEED ACTIVITY LOGS
  // ═══════════════════════════════════════════
  const insertLog = db.prepare(
    'INSERT INTO activity_logs (user_id, action, entity, entity_id, details, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
  );

  insertLog.run(1, 'create_month', 'month', 1, '{"label":"April 2026"}', '2026-04-01T09:00:00Z');
  insertLog.run(1, 'create_month', 'month', 2, '{"label":"May 2026"}', '2026-05-01T09:00:00Z');
  insertLog.run(1, 'create_month', 'month', 3, '{"label":"June 2026"}', '2026-06-01T09:00:00Z');
  insertLog.run(1, 'create_month', 'month', 4, '{"label":"July 2026"}', '2026-07-01T09:00:00Z');

  // Section submissions
  for (let s = 1; s <= 13; s++) {
    for (let m = 1; m <= 3; m++) {
      insertLog.run(s + 1, 'submit', 'report', reportIds[`${s}-${m}`],
        `{"section":"${sections[s-1].code}","month":"${months[m-1].label}"}`,
        `2026-0${m + 3}-28T${String(rand(14, 18)).padStart(2, '0')}:${String(rand(0, 59)).padStart(2, '0')}:00Z`
      );
    }
  }

  console.log('✅ Activity logs seeded');
  console.log('\n🎉 Database seeding complete!\n');
  console.log('Default login credentials:');
  console.log('  Admin:        ADMIN001 / admin123');
  console.log('  Section User: PMD001   / admin123');
  console.log('  Viewer:       VIEWER001 / admin123');
}

// Run if called directly
if (require.main === module) {
  seed();
  process.exit(0);
}

module.exports = { seed };
