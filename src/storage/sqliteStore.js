const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

class SqliteStore {
  constructor(filename = './data/ratelimit.db') {
    if (filename !== ':memory:') {
      fs.mkdirSync(path.dirname(path.resolve(filename)), { recursive: true });
    }
    this.db = new DatabaseSync(filename);
    this.db.exec('PRAGMA journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        key   TEXT PRIMARY KEY,
        state TEXT NOT NULL
      )
    `);
    this.getStmt = this.db.prepare('SELECT state FROM rate_limits WHERE key = ?');
    this.putStmt = this.db.prepare(
      'INSERT INTO rate_limits (key, state) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET state = excluded.state'
    );
  }

  async update(key, fn) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const row = this.getStmt.get(key);
      const [state, result] = fn(row ? JSON.parse(row.state) : undefined);
      this.putStmt.run(key, JSON.stringify(state));
      this.db.exec('COMMIT');
      return result;
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  async close() {
    this.db.close();
  }
}

module.exports = SqliteStore;
