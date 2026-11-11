const express = require('express');
const auth = require('./middleware/auth');
const rateLimit = require('./middleware/rateLimit');

function createApp({ store, clients }) {
  const app = express();
  const authenticate = auth(clients);

  for (const endpoint of ['foo', 'bar']) {
    app.get(
      `/${endpoint}`,
      authenticate,
      rateLimit({ endpoint, store }),
      (req, res) => res.status(200).json({ success: true })
    );
  }

  app.get('/health', (req, res) => res.json({ ok: true }));

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'internal server error' });
  });

  return app;
}

module.exports = createApp;
