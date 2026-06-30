const { getConnection } = require('./connection');

function clearData() {
  const db = getConnection();
  
  try {
    db.exec('BEGIN TRANSACTION');

    // Wipe all module data
    db.prepare('DELETE FROM high_impact_items').run();
    db.prepare('DELETE FROM module_5s').run();
    db.prepare('DELETE FROM module_am').run();
    db.prepare('DELETE FROM module_abnormalities').run();
    db.prepare('DELETE FROM module_avinya').run();
    db.prepare('DELETE FROM module_kaizens').run();
    db.prepare('DELETE FROM module_lean_projects').run();
    db.prepare('DELETE FROM module_process_std').run();
    db.prepare('DELETE FROM module_iso').run();
    db.prepare('DELETE FROM module_opportunities').run();
    db.prepare('DELETE FROM module_high_impact').run();
    
    // Wipe reports
    db.prepare('DELETE FROM monthly_reports').run();

    // Wipe logs
    db.prepare('DELETE FROM activity_logs').run();
    
    db.exec('COMMIT');
    console.log('✅ Successfully cleared all mock reports, modules, and logs.');
    console.log('Master data (sections, users, months) has been preserved.');
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('❌ Failed to clear mock data:', error);
  }
}

clearData();
