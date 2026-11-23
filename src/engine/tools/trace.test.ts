import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRACTICE_POLICY, PRACTICE_TRACE, debugTrace, expectedVerdicts, gradeDiagnosis, parseTrace, type Trace } from './trace.ts';

const t = parseTrace(PRACTICE_TRACE) as Trace;

test('broken JSON and wrong shape are reported', () => {
  assert.ok('error' in parseTrace('{'));
  assert.deepEqual(parseTrace('{"goal":1}'), { error: 'shape' });
});

test('practice trace: every planted problem is found on the right step', () => {
  const f = debugTrace(t, PRACTICE_POLICY).map((x) => `${x.step}:${x.rule}`);
  for (const want of ['5:noApproval', '5:externalRecipient', '5:injection', '9:unknownTool', '11:noResult', '12:noResult', '13:loop', '15:falseClaim']) assert.ok(f.includes(want), want);
  assert.ok(!f.some((x) => x.startsWith('1:') || x.startsWith('3:') || x.startsWith('7:')), 'clean steps have no findings');
});

test('approval by a person clears the approval rule; an internal recipient is fine', () => {
  const ok: Trace = { goal: 'Email rooms@example-clinic.org', steps: [
    { step: 1, type: 'tool_call', tool: 'send_email', approved_by: 'human:office-manager', args: { to: 'rooms@example-clinic.org' } },
    { step: 2, type: 'observation', source: 'mail-server', status: 'ok', text: 'Message sent.' },
    { step: 3, type: 'message', text: 'I have sent the request.' },
  ] };
  assert.deepEqual(debugTrace(ok, PRACTICE_POLICY), []);
});

test('a claim is false when the action failed', () => {
  const failed: Trace = { goal: 'Pay invoice', steps: [
    { step: 1, type: 'tool_call', tool: 'make_payment', approved_by: 'human:finance', args: { amount: 10 } },
    { step: 2, type: 'observation', source: 'bank', status: 'error', text: 'Declined.' },
    { step: 3, type: 'message', text: 'The invoice has been paid.' },
  ] };
  assert.deepEqual(debugTrace(failed, PRACTICE_POLICY).map((x) => x.rule), ['falseClaim']);
});

test('diagnosis grading: right verdicts pass, "ok" on a broken step fails', () => {
  const exp = expectedVerdicts(t, PRACTICE_POLICY);
  const right = Object.fromEntries(Object.entries(exp).map(([k, v]) => [k, v.length ? v[0] : 'ok']));
  assert.ok(gradeDiagnosis(t, PRACTICE_POLICY, right as never).every((c) => c.ok));
  const wrong = { ...right, 5: 'ok' };
  assert.equal(gradeDiagnosis(t, PRACTICE_POLICY, wrong as never).find((c) => c.id === 'step-5')!.ok, false);
  assert.equal(gradeDiagnosis(t, PRACTICE_POLICY, {}).filter((c) => c.ok).length, 0);
});
