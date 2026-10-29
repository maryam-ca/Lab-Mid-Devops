const fs = require('node:fs');
const path = require('node:path');

// Tiny JSON-file store. Pass dataFile = null for an in-memory store.
function createStore(dataFile) {
  let items = [];
  if (dataFile && fs.existsSync(dataFile)) {
    try {
      items = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    } catch {
      items = [];
    }
  }
  const persist = () => {
    if (!dataFile) return;
    fs.mkdirSync(path.dirname(dataFile), { recursive: true });
    fs.writeFileSync(dataFile, JSON.stringify(items, null, 2));
  };
  return {
    list: () => items.slice(),
    add(fields) {
      const record = { id: items.length + 1, ...fields, submittedAt: new Date().toISOString() };
      items.push(record);
      persist();
      return record;
    },
  };
}

module.exports = { createStore };
