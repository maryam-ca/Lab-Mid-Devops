const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { validateSubmission } = require('../public/validation');
const { createStore } = require('./store');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e5) { req.destroy(); reject(new Error('Body too large')); }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function createServer({ dataFile = null } = {}) {
  const store = createStore(dataFile);

  return http.createServer(async (req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost');

    if (pathname === '/api/submissions' && req.method === 'GET') {
      return send(res, 200, store.list());
    }

    if (pathname === '/api/submissions' && req.method === 'POST') {
      let payload;
      try {
        payload = JSON.parse(await readBody(req));
      } catch {
        return send(res, 400, { errors: ['Request body must be valid JSON'] });
      }
      const result = validateSubmission(payload);
      if (!result.valid) return send(res, 400, { errors: result.errors });
      return send(res, 201, store.add(result.value));
    }

    if (req.method === 'GET') {
      const file = pathname === '/' ? 'index.html' : pathname.slice(1);
      const full = path.join(PUBLIC_DIR, file);
      if (full.startsWith(PUBLIC_DIR) && fs.existsSync(full) && fs.statSync(full).isFile()) {
        res.writeHead(200, { 'Content-Type': TYPES[path.extname(full)] || 'application/octet-stream' });
        return fs.createReadStream(full).pipe(res);
      }
    }
    send(res, 404, { errors: ['Not found'] });
  });
}

module.exports = { createServer };

if (require.main === module) {
  const port = process.env.PORT || 3000;
  const dataFile = path.join(__dirname, '..', 'data', 'submissions.json');
  createServer({ dataFile }).listen(port, () => console.log(`Portal running at http://localhost:${port}`));
}
