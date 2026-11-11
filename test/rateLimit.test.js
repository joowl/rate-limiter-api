const test = require('node:test');
const assert = require('node:assert/strict');

const createApp = require('../src/app');
const { MemoryStore } = require('../src/storage');

const clients = {
  small: { foo: { limit: 2, windowMs: 60000 }, bar: { limit: 2, windowMs: 60000 } },
  large: { foo: { limit: 4, windowMs: 60000 }, bar: { limit: 4, windowMs: 60000 } },
};

function start() {
  const store = new MemoryStore();
  const server = createApp({ store, clients }).listen(0);
  const url = `http://127.0.0.1:${server.address().port}`;
  const get = (path, client) =>
    fetch(url + path, { headers: client ? { Authorization: `Bearer ${client}` } : {} });
  const stop = () => new Promise((resolve) => server.close(resolve));
  return { get, stop };
}

for (const endpoint of ['/foo', '/bar']) {
  test(`${endpoint} returns 200 until the limit, then 429`, async () => {
    const { get, stop } = start();

    for (let i = 0; i < 2; i++) {
      const res = await get(endpoint, 'small');
      assert.equal(res.status, 200);
      assert.deepEqual(await res.json(), { success: true });
    }

    const res = await get(endpoint, 'small');
    assert.equal(res.status, 429);
    assert.deepEqual(await res.json(), { error: 'rate limit exceeded' });

    await stop();
  });

  test(`${endpoint} gives each client its own limit`, async () => {
    const { get, stop } = start();

    await get(endpoint, 'small');
    await get(endpoint, 'small');
    assert.equal((await get(endpoint, 'small')).status, 429);

    for (let i = 0; i < 4; i++) {
      assert.equal((await get(endpoint, 'large')).status, 200);
    }
    assert.equal((await get(endpoint, 'large')).status, 429);

    await stop();
  });
}

test('missing or unknown client gets 401', async () => {
  const { get, stop } = start();

  assert.equal((await get('/foo')).status, 401);
  assert.equal((await get('/foo', 'nobody')).status, 401);

  await stop();
});
