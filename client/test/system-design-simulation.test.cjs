const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../lib/system-design-simulation.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const context = { exports: {}, structuredClone };
vm.runInNewContext(compiled, context);
const { initialSimulation, sendRequests, advanceSimulation, isSimulationBusy } = context.exports;
function finish(s) { for (let i = 0; i < 2000 && isSimulationBusy(s); i++) s = advanceSimulation(s, .05); assert.equal(isSimulationBusy(s), false); return s; }

test('round robin distributes distinct requests and skips offline instances', () => {
  const balanced = finish(sendRequests(initialSimulation(), 6));
  assert.equal(balanced.routed.a, 3); assert.equal(balanced.routed.b, 3);
  const offline = initialSimulation(); offline.healthy.a = false;
  const routed = finish(sendRequests(offline, 6));
  assert.equal(routed.routed.a, 0); assert.equal(routed.routed.b, 6);
  offline.healthy.b = false;
  const failed = finish(sendRequests(offline, 1));
  assert.equal(failed.rejected, 1); assert.equal(failed.reads, 0); assert.equal(failed.acknowledged, 0);
});
test('cold cache reads the database, fills the key, and later hits skip the database', () => {
  const cold = finish(sendRequests(initialSimulation(), 1));
  assert.equal(cold.misses, 1); assert.equal(cold.reads, 1); assert.ok(cold.cache['course:42'] > cold.time);
  const hit = finish(sendRequests(cold, 1));
  assert.equal(hit.hits, 1); assert.equal(hit.reads, 1); assert.equal(hit.completed, 2);
  const expired = advanceSimulation(hit, 30);
  assert.equal(Object.keys(expired.cache).length, 0);
  const miss = finish(sendRequests(expired, 1)); assert.equal(miss.reads, 2);
});
test('a warm cache sends responses without database traffic', () => {
  const warm = initialSimulation(); warm.cache = { 'course:42': 1000, 'course:17': 1000 };
  const result = finish(sendRequests(warm, 6));
  assert.equal(result.hits, 6); assert.equal(result.reads, 0); assert.equal(result.completed, 6); assert.equal(result.acknowledged, 6);
});
test('single consumer retains each job until ACK and consumes FIFO', () => {
  let s = initialSimulation(); s.cache = { 'course:42': 1000, 'course:17': 1000 }; s = sendRequests(s, 6);
  const claimed = []; let previous = null; let sawBacklog = false; let responseBeforeJobFinished = false;
  for (let i = 0; i < 1500 && isSimulationBusy(s); i++) {
    s = advanceSimulation(s, .05);
    if (s.worker?.job.id !== previous && s.worker) claimed.push(s.worker.job.id);
    previous = s.worker?.job.id ?? null;
    if (s.worker && s.jobs.length) sawBacklog = true;
    if (s.completed > s.acknowledged) responseBeforeJobFinished = true;
    assert.equal(s.jobs.some(j => j.id === s.worker?.job.id), false);
  }
  assert.deepEqual(claimed, [1, 2, 3, 4, 5, 6]); assert.ok(sawBacklog); assert.ok(responseBeforeJobFinished); assert.equal(s.acknowledged, 6);
});
test('failed job retries at the tail and is acknowledged once after success', () => {
  let s = initialSimulation(); s.cache = { 'course:42': 1000, 'course:17': 1000 }; s.failNext = true; s = sendRequests(s, 6);
  const claimed = []; let previous = null;
  for (let i = 0; i < 1500 && isSimulationBusy(s); i++) {
    s = advanceSimulation(s, .05);
    if (s.worker && `${s.worker.job.id}:${s.worker.job.attempt}` !== previous) claimed.push(`${s.worker.job.id}:${s.worker.job.attempt}`);
    previous = s.worker ? `${s.worker.job.id}:${s.worker.job.attempt}` : null;
  }
  assert.equal(s.retries, 1); assert.equal(s.acknowledged, 6);
  assert.ok(claimed.indexOf('2:1') < claimed.indexOf('1:2'));
});
test('advancing is pure and frame chunking preserves simulation outcomes', () => {
  const original = sendRequests(initialSimulation(), 6), snapshot = JSON.stringify(original);
  const large = advanceSimulation(original, 12);
  let small = original; for (let i = 0; i < 240; i++) small = advanceSimulation(small, .05);
  assert.equal(JSON.stringify(original), snapshot);
  for (const metric of ['hits', 'misses', 'reads', 'completed', 'acknowledged']) assert.equal(large[metric], small[metric]);
});
