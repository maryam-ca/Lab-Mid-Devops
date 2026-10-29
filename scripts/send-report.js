// POSTs test-report.json to the local receiver (RECEIVER_URL), e.g. via a tunnel.
const fs = require('node:fs');

(async () => {
  const url = process.env.RECEIVER_URL || 'http://localhost:4000/report';
  const body = fs.readFileSync('test-report.json', 'utf8');
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.RECEIVER_TOKEN) headers['X-Report-Token'] = process.env.RECEIVER_TOKEN;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { method: 'POST', headers, body });
      if (res.ok) return console.log(`Report delivered to ${url} (${res.status})`);
      console.error(`Receiver responded ${res.status}`);
    } catch (err) {
      console.error(`Attempt ${attempt} failed: ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
  console.error('Could not deliver report to receiver');
  process.exit(1);
})();
