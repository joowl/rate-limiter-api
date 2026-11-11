const createApp = require('./app');
const { createStore } = require('./storage');
const config = require('./config');

const store = createStore(config);
const app = createApp({ store, clients: config.clients });

const server = app.listen(config.port, () => {
  console.log(`Listening on :${config.port} (storage: ${config.storage})`);
});

function shutdown() {
  server.close(async () => {
    await store.close();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
