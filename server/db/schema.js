const { getConnection } = require('./connection');

function createTables() {
  const db = getConnection();

  db.exec(`
    CREATE TABLE IF NOT EXISTS sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      display_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'section_user', 'viewer')),
      section_id INTEGER,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (section_id) REFERENCES sections(id)
    );

    CREATE TABLE IF NOT EXISTS reporting_months (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      label TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'closed')),
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id),
      UNIQUE(month, year)
    );

    CREATE TABLE IF NOT EXISTS monthly_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_id INTEGER NOT NULL,
      month_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted')),
      submitted_at DATETIME,
      submitted_by INTEGER,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_by INTEGER,
      FOREIGN KEY (section_id) REFERENCES sections(id),
      FOREIGN KEY (month_id) REFERENCES reporting_months(id),
      FOREIGN KEY (submitted_by) REFERENCES users(id),
      FOREIGN KEY (updated_by) REFERENCES users(id),
      UNIQUE(section_id, month_id)
    );

    CREATE TABLE IF NOT EXISTS module_5s (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER UNIQUE NOT NULL,
      audit_score REAL,
      target REAL,
      actual REAL,
      remarks TEXT,
      file_path TEXT,
      FOREIGN KEY (report_id) REFERENCES monthly_reports(id)
    );

    CREATE TABLE IF NOT EXISTS module_am (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER UNIQUE NOT NULL,
      clri_target INTEGER,
      clri_completed INTEGER,
      clri_pending INTEGER,
      closure_pct REAL,
      remarks TEXT,
      FOREIGN KEY (report_id) REFERENCES monthly_reports(id)
    );

    CREATE TABLE IF NOT EXISTS module_abnormalities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER UNIQUE NOT NULL,
      white_tags INTEGER DEFAULT 0,
      red_tags INTEGER DEFAULT 0,
      total INTEGER DEFAULT 0,
      closed INTEGER DEFAULT 0,
      pending INTEGER DEFAULT 0,
      repeated INTEGER DEFAULT 0,
      capa_status TEXT,
      remarks TEXT,
      FOREIGN KEY (report_id) REFERENCES monthly_reports(id)
    );

    CREATE TABLE IF NOT EXISTS module_avinya (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER UNIQUE NOT NULL,
      observations_posted INTEGER DEFAULT 0,
      closed INTEGER DEFAULT 0,
      pending INTEGER DEFAULT 0,
      remarks TEXT,
      FOREIGN KEY (report_id) REFERENCES monthly_reports(id)
    );

    CREATE TABLE IF NOT EXISTS module_kaizens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER UNIQUE NOT NULL,
      submitted INTEGER DEFAULT 0,
      approved INTEGER DEFAULT 0,
      implemented INTEGER DEFAULT 0,
      savings REAL DEFAULT 0,
      remarks TEXT,
      FOREIGN KEY (report_id) REFERENCES monthly_reports(id)
    );

    CREATE TABLE IF NOT EXISTS module_lean_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER UNIQUE NOT NULL,
      qcc INTEGER DEFAULT 0,
      smed INTEGER DEFAULT 0,
      kanban INTEGER DEFAULT 0,
      poka_yoke INTEGER DEFAULT 0,
      vsm INTEGER DEFAULT 0,
      other_lean INTEGER DEFAULT 0,
      status TEXT,
      completion_pct REAL DEFAULT 0,
      FOREIGN KEY (report_id) REFERENCES monthly_reports(id)
    );

    CREATE TABLE IF NOT EXISTS module_process_std (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER UNIQUE NOT NULL,
      audit_findings INTEGER DEFAULT 0,
      closed INTEGER DEFAULT 0,
      pending INTEGER DEFAULT 0,
      remarks TEXT,
      FOREIGN KEY (report_id) REFERENCES monthly_reports(id)
    );

    CREATE TABLE IF NOT EXISTS module_iso (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER UNIQUE NOT NULL,
      qms_target REAL,
      qms_current REAL,
      qms_status TEXT,
      ems_target REAL,
      ems_current REAL,
      ems_status TEXT,
      ohsas_target REAL,
      ohsas_current REAL,
      ohsas_status TEXT,
      remarks TEXT,
      FOREIGN KEY (report_id) REFERENCES monthly_reports(id)
    );

    CREATE TABLE IF NOT EXISTS module_opportunities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER UNIQUE NOT NULL,
      development TEXT,
      digitalisation TEXT,
      automation TEXT,
      suggestions TEXT,
      priority TEXT,
      FOREIGN KEY (report_id) REFERENCES monthly_reports(id)
    );

    CREATE TABLE IF NOT EXISTS module_high_impact (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER UNIQUE NOT NULL,
      FOREIGN KEY (report_id) REFERENCES monthly_reports(id)
    );

    CREATE TABLE IF NOT EXISTS high_impact_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      module_id INTEGER NOT NULL,
      project_name TEXT,
      description TEXT,
      owner TEXT,
      status TEXT,
      savings REAL DEFAULT 0,
      completion_pct REAL DEFAULT 0,
      target_date TEXT,
      FOREIGN KEY (module_id) REFERENCES module_high_impact(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity TEXT,
      entity_id INTEGER,
      details TEXT,
      ip_address TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS uploads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER,
      module_name TEXT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      uploaded_by INTEGER,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES monthly_reports(id),
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );
  `);

  console.log('✅ All tables created successfully');
}

module.exports = { createTables };
