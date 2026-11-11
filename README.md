# Rate Limiter API

Express (Node.js) API with two rate-limited GET endpoints.

Both endpoints enforce the same rule: **a client may not send more than `x` requests within any `y` time frame.** Limits are configured per client and per endpoint as `{ limit, windowMs }`.

- Success: `200 { "success": true }` (plus `X-Ratelimit-Remaining` header)
- Limit reached: `429 { "error": "rate limit exceeded" }` (plus `Retry-After` header)
- Missing/unknown client: `401 { "error": "unauthorized" }`

Every request needs the header `Authorization: Bearer <client-id>`.

## Clients (see `src/config.js`)

| Client           | `/foo`              | `/bar`              |
|------------------|---------------------|---------------------|
| `client-basic`   | 3 requests / 10s    | 5 requests / 10s    |
| `client-premium` | 10 requests / 10s   | 20 requests / 10s   |

Each client has its own `limit` (max requests) and `windowMs` (window length in ms) per endpoint. Add or change clients by editing `src/config.js`.

## Storage strategies

Selected with the `STORAGE` env var:

- `memory` (default): in-process `Map`. Counters reset on restart.
- `sqlite`: persistent, stored in a SQLite file (`SQLITE_PATH`, default `./data/ratelimit.db`). Counters survive restarts. Uses Node's built-in `node:sqlite`, so it **requires Node 22.13 or newer**.

## Run

Requires Node 18+ for in-memory storage, and Node 22.13+ for SQLite storage.

```bash
npm install
npm start                # in-memory storage on :3000
npm run start:sqlite     # persistent storage on :3000
PORT=8080 STORAGE=sqlite SQLITE_PATH=/tmp/rl.db npm start
```

### Try it

There is a [Postman Collection](./Rate_Limiter_API.postman_collection.json) available with all local and cloud endpoints.

The cloud project on Render is accessible through the following endpoint: https://rate-limiter-api-xh0b.onrender.com

Have in mind that this instance spins down after 15 minutes of inactivity, and it takes a minute for it to be ready for new requests.

### Cloud examples

```bash
# check if instance is up and running
curl -s -w " %{http_code}\n" -H "Authorization: Bearer client-basic" https://rate-limiter-api-xh0b.onrender.com/health

# basic client: 3rd request OK, 4th is 429
for i in $(seq 1 4); do curl -s -w " %{http_code}\n" -H "Authorization: Bearer client-basic" https://rate-limiter-api-xh0b.onrender.com/foo; done

# /bar has a higher limit: 5th request OK, 6th is 429
for i in $(seq 1 6); do curl -s -w " %{http_code}\n" -H "Authorization: Bearer client-basic" https://rate-limiter-api-xh0b.onrender.com/bar; done

# premium client has higher limits: all requests OK
for i in $(seq 1 6); do curl -s -w " %{http_code}\n" -H "Authorization: Bearer client-premium" https://rate-limiter-api-xh0b.onrender.com/foo; done
# if executed 2 times in a 10s window, the 2 last requests will be 429

# /bar with premium client reaching it's limit: 20th request OK, 21st is 429
for i in $(seq 1 21); do curl -s -w " %{http_code}\n" -H "Authorization: Bearer client-premium" https://rate-limiter-api-xh0b.onrender.com/bar; done
```

### Local examples

```bash
# basic client: 3rd request OK, 4th is 429
for i in $(seq 1 4); do curl -s -w " %{http_code}\n" -H "Authorization: Bearer client-basic" localhost:3000/foo; done

# /bar has a higher limit: 5th request OK, 6th is 429
for i in $(seq 1 6); do curl -s -w " %{http_code}\n" -H "Authorization: Bearer client-basic" localhost:3000/bar; done

# premium client has higher limits: all requests OK
for i in $(seq 1 6); do curl -s -w " %{http_code}\n" -H "Authorization: Bearer client-premium" localhost:3000/foo; done
# if executed 2 times in a 10s window, the 2 last requests will be 429

# /bar with premium client reaching it's limit: 20th request OK, 21st is 429
for i in $(seq 1 21); do curl -s -w " %{http_code}\n" -H "Authorization: Bearer client-premium" localhost:3000/bar; done
```

## Tests

```bash
npm test
```

Uses Node's built-in test runner. The tests call `/foo` and `/bar` with two clients and check the 200, 429 and 401 responses.

## Algorithm

Implemented in `src/algorithms/rateLimiting.js` as a sliding window log. For each client and endpoint we keep the timestamps of recent allowed requests. On each request we drop timestamps older than `windowMs`; if fewer than `limit` remain the request is allowed (and its timestamp stored), otherwise it gets a 429. Rejected requests are not stored, so at most `limit` timestamps are kept per client and endpoint.
