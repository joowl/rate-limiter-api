const MemoryStore = require('./memoryStore');

function createStore({ storage, sqlitePath }) {
  switch (storage) {
    case 'memory':
      return new MemoryStore();
    case 'sqlite': {
      const SqliteStore = require('./sqliteStore');
      return new SqliteStore(sqlitePath);
    }
    default:
      throw new Error(`Unknown STORAGE "${storage}" (expected "memory" or "sqlite")`);
  }
}

module.exports = { createStore, MemoryStore };
