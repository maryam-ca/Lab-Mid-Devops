// Custom node:test reporter: collects the real results and writes test-report.json + report.txt.
const fs = require('node:fs');

function failureMessage(error) {
  if (!error) return null;
  const cause = error.cause || error;
  const msg = String(cause.message || error.message || error).split('\n')[0].replace(/:$/, '');
  return 'expected' in cause ? `${msg} (expected ${JSON.stringify(cause.expected)}, got ${JSON.stringify(cause.actual)})` : msg;
}

module.exports = async function* reporter(source) {
  const tests = [];
  for await (const event of source) {
    if (event.type !== 'test:pass' && event.type !== 'test:fail') continue;
    if (event.data.details && event.data.details.type === 'suite') continue;
    const failed = event.type === 'test:fail';
    tests.push({
      name: event.data.name,
      result: failed ? 'failed' : 'passed',
      failureMessage: failed ? failureMessage(event.data.details.error) : null,
    });
  }

  const passed = tests.filter((t) => t.result === 'passed').length;
  const failed = tests.length - passed;
  const env = process.env;
  const report = {
    repository: env.GITHUB_REPOSITORY || 'local',
    branch: env.GITHUB_REF_NAME || 'local',
    commitSha: env.GITHUB_SHA || 'local',
    pipelineRunId: env.GITHUB_RUN_ID || 'local',
    runNumber: env.GITHUB_RUN_NUMBER || 'local',
    timestamp: new Date().toISOString(),
    tests,
    summary: { total: tests.length, passed, failed },
    status: failed === 0 && tests.length > 0 ? 'passed' : 'failed',
  };
  fs.writeFileSync('test-report.json', JSON.stringify(report, null, 2));

  const lines = [
    `Repository: ${report.repository}  Branch: ${report.branch}`,
    `Commit: ${report.commitSha}  Run: ${report.pipelineRunId}`,
    `Overall status: ${report.status.toUpperCase()}  (total ${tests.length}, passed ${passed}, failed ${failed})`,
    '',
    ...tests.map((t) => `${t.result === 'passed' ? 'PASS' : 'FAIL'}  ${t.name}${t.failureMessage ? `\n      ${t.failureMessage}` : ''}`),
  ];
  fs.writeFileSync('report.txt', lines.join('\n') + '\n');
};
