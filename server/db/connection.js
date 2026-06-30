const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'mec_dashboard.db');

let db;

function getConnection() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

module.exports = { getConnection, DB_PATH };
