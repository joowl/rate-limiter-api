class MemoryStore {
  constructor() {
    this.data = new Map();
  }

  async update(key, fn) {
    const [state, result] = fn(this.data.get(key));
    this.data.set(key, state);
    return result;
  }

  async close() {}
}

module.exports = MemoryStore;
