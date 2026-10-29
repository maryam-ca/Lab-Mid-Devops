# Assignment Submission Portal (CSC418 Lab Midterm)

Node.js (v20+, no npm dependencies) portal where students submit name, registration number,
assignment title and a submission URL. Every push runs automated tests in GitHub Actions and the
test report is delivered to a local receiver that saves it as `test-report.json`.

## Run the application
```bash
npm start            # http://localhost:3000
```
Submissions are saved in `data/submissions.json`. Validation: all fields required, URL must be a valid http(s) link.

## Run the tests
```bash
npm test             # plain test output
npm run test:report  # runs tests, writes test-report.json + report.txt, exits 1 on failure
```
Tests (`test/portal.test.js`): valid submission saved, missing registration number rejected, invalid URL rejected.

## Start the local report receiver
```bash
npm run receiver     # listens on http://localhost:4000/report, writes ./test-report.json
```
Optional: `RECEIVER_TOKEN=secret npm run receiver` to require an `X-Report-Token` header.

## Connect CI to your computer (pick one)
**A. Tunnel (GitHub-hosted runner):** keep the receiver running, then in another terminal run
`cloudflared tunnel --url http://localhost:4000` (or `ngrok http 4000`). Add the repo secret
`RECEIVER_URL` = `https://<tunnel-host>/report` (and `RECEIVER_TOKEN` if used). Keep both running during the demo.

**B. Self-hosted runner:** register a runner on your computer (Settings → Actions → Runners), set the repo
variable `RUNNER_LABEL` = `self-hosted`, and secret `RECEIVER_URL` = `http://localhost:4000/report`.

## CI pipeline (`.github/workflows/ci.yml`)
1. `Run tests` – a failing test fails this step (and the job).
2. `Send report` – always runs (pass or fail) and POSTs the real report to the receiver.
3. Report also uploaded as a workflow artifact.

Report contents: repository, branch, commitSha, pipelineRunId, timestamp, per-test name/result/failureMessage,
total/passed/failed counts and overall status.

## Bonus: GitHub Pages (conditional deploy)
Settings → Pages → Source: **GitHub Actions**. The `deploy` job `needs: test` and only runs on `main`, so a failing
run never replaces the published version. The static page falls back to browser localStorage (no backend on Pages).

## Bonus: email report
Add secrets `MAIL_SERVER`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` (e.g. a Gmail app password), `MAIL_TO`.
The email step runs after both passing and failing runs and attaches `test-report.json`.

## Demo workflow
1. Push → all green → check `test-report.json` shows `"status": "passed"`.
2. Break `public/validation.js` (e.g. remove the regNo check) → push → red run, JSON shows `"failed"`.
3. Fix it → push → green again, JSON updated.
