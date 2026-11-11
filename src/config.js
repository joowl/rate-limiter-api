const clients = {
  'client-basic': {
    foo: { limit: 3, windowMs: 10000 },
    bar: { limit: 5, windowMs: 10000 },
  },
  'client-premium': {
    foo: { limit: 10, windowMs: 10000 },
    bar: { limit: 20, windowMs: 10000 },
  },
};

module.exports = {
  clients,
  port: Number(process.env.PORT) || 3000,
  storage: (process.env.STORAGE || 'memory').toLowerCase(), // 'memory' | 'sqlite'
  sqlitePath: process.env.SQLITE_PATH || './data/ratelimit.db',
};
