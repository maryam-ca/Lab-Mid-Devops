// Local HTTP receiver: accepts the CI test report and saves it as test-report.json.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = process.env.PORT || 4000;
const TOKEN = process.env.RECEIVER_TOKEN || '';
const OUT = process.env.REPORT_FILE || path.join(process.cwd(), 'test-report.json');
const REQUIRED = ['repository', 'branch', 'commitSha', 'pipelineRunId', 'timestamp', 'tests', 'summary', 'status'];

const server = http.createServer((req, res) => {
  const reply = (code, text) => { res.writeHead(code, { 'Content-Type': 'text/plain' }); res.end(text); };

  if (req.method === 'GET' && req.url === '/health') return reply(200, 'ok');
  if (req.method !== 'POST' || req.url !== '/report') return reply(404, 'Not found');
  if (TOKEN && req.headers['x-report-token'] !== TOKEN) return reply(401, 'Bad token');

  let data = '';
  req.on('data', (c) => { data += c; if (data.length > 1e6) req.destroy(); });
  req.on('end', () => {
    let report;
    try { report = JSON.parse(data); } catch { return reply(400, 'Invalid JSON'); }
    const missing = REQUIRED.filter((k) => !(k in report));
    if (missing.length) return reply(400, `Missing fields: ${missing.join(', ')}`);

    const tmp = OUT + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(report, null, 2));
    fs.renameSync(tmp, OUT);
    console.log(`[${new Date().toISOString()}] Saved ${OUT}: ${report.status} (${report.summary.passed}/${report.summary.total} passed) commit ${String(report.commitSha).slice(0, 7)}`);
    reply(200, 'saved');
  });
});

server.listen(PORT, () => console.log(`Receiver listening on http://localhost:${PORT}/report -> ${OUT}`));
