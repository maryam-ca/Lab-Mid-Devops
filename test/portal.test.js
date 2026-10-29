const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../src/server');

let server;
let base;

before(async () => {
  server = createServer(); // in-memory store, fresh for each run
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

const valid = {
  name: 'Ali Khan',
  regNo: 'FA24-BAI-001',
  title: 'Lab Assignment 1',
  url: 'https://github.com/ali/lab1',
};

const post = (body) =>
  fetch(`${base}/api/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
const list = async () => (await fetch(`${base}/api/submissions`)).json();

test('Complete details and a valid submission URL: saved and appears in the list', async () => {
  const res = await post(valid);
  assert.equal(res.status, 201);
  const items = await list();
  assert.ok(items.some((s) => s.regNo === valid.regNo && s.url === valid.url));
});

test('Missing registration number: rejected with a validation message', async () => {
  const res = await post({ ...valid, regNo: '' });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.ok(body.errors.some((e) => /registration number/i.test(e)));
});

test('Invalid submission URL: rejected and not saved', async () => {
  const before = (await list()).length;
  const res = await post({ ...valid, regNo: 'FA24-BAI-002', url: 'not-a-valid-url' });
  assert.equal(res.status, 400);
  assert.equal((await list()).length, before);
});
