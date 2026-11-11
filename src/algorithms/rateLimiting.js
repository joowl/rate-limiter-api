function consume(state, now, { limit, windowMs }) {
  const recent = ((state && state.timestamps) || []).filter((t) => now - t < windowMs);

  if (recent.length < limit) {
    const timestamps = [...recent, now];
    return [{ timestamps }, { allowed: true, remaining: limit - timestamps.length, retryAfterMs: 0 }];
  }
  // Blocked until the oldest request in the window falls out of it.
  return [{ timestamps: recent }, { allowed: false, remaining: 0, retryAfterMs: recent[0] + windowMs - now }];
}

module.exports = { consume };
