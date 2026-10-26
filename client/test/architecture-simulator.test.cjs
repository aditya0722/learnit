const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
function load(file) {
  const source = fs.readFileSync(path.join(__dirname, '../lib', file), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const context = { exports: {}, structuredClone, TextEncoder, TextDecoder, btoa, atob, require: name => { assert.equal(name, './system-design'); return load('system-design.ts'); } };
  vm.runInNewContext(compiled, context); return context.exports;
}
const engine = load('architecture-simulator.ts');
const designApi = load('system-design.ts');
const node = (id, type, simulation) => ({ id, type, label: id, x: 100, y: 100, ...(simulation ? { simulation } : {}) });
const edge = (from, to, mode = 'auto') => ({ id: `${from}-${to}`, from, to, simulation: { mode, latencyMs: 10 } });
const graph = () => ({ version: 1, title: 'Arbitrary identities', nodes: [node('desktop', 'Client'), node('ingress', 'Load balancer'), node('amber', 'API server'), node('green', 'API server'), node('lookup', 'Cache'), node('records', 'Database'), node('buffer', 'Queue'), node('consumer', 'Worker')], edges: [edge('desktop','ingress'), edge('ingress','amber'), edge('ingress','green'), ...['amber','green'].flatMap(id => [edge(id,'lookup'), edge(id,'records'), edge(id,'buffer','async')]), edge('buffer','consumer','async')] });
const profile = { entry: 'desktop', rps: 10, keySpace: 1, readPercent: 100, timeoutMs: 10000, durationMs: 1000 };
const advance = (state, design, ms = 10000) => engine.advanceLab(state, design, ms);

test('expanded types preserve gateway calls, database caching, and broker worker acknowledgements', () => {
  const design = {
    version: 1, title: 'Expanded components',
    nodes: [node('desktop', 'Browser'), node('gateway', 'API gateway'), node('service', 'Microservice'), node('cache', 'Cache'), node('data', 'NoSQL database'), node('broker', 'Message broker'), node('processor', 'Stream processor'), node('files', 'File storage')],
    edges: [edge('desktop', 'gateway'), edge('gateway', 'service'), edge('service', 'cache'), edge('service', 'data'), edge('service', 'broker', 'async'), edge('broker', 'processor', 'async'), edge('processor', 'files')],
  };
  assert.doesNotThrow(() => designApi.parseDesign(design));
  let state = advance(engine.sendLabRequests(engine.createLabState(design), design, 1, profile), design);
  assert.equal(state.succeeded, 1);
  assert.equal(state.nodes.data.processed, 1);
  assert.equal(state.nodes.broker.acknowledged, 1);
  state = advance(engine.sendLabRequests(state, design, 1, profile), design, 5000);
  assert.equal(state.succeeded, 2);
  assert.equal(state.nodes.gateway.processed, 2);
  assert.equal(state.nodes.cache.hits, 1);
  assert.equal(state.nodes.data.processed, 1);
  assert.equal(state.nodes.broker.acknowledged, 2);
  assert.equal(state.nodes.files.processed, 2);
});

test('arbitrary graph executes; warm cache skips storage and traces return paths', () => {
  const design = graph();
  let state = engine.sendLabRequests(engine.createLabState(design), design, 1, profile);
  state = advance(state, design, 1000);
  assert.equal(state.succeeded, 1); assert.equal(state.nodes.records.processed, 1);
  state = engine.sendLabRequests(state, design, 1, profile); state = advance(state, design, 1000);
  assert.equal(state.succeeded, 2); assert.equal(state.nodes.lookup.hits, 1); assert.equal(state.nodes.records.processed, 1);
  assert.ok(state.requests.at(-1).trace.some(t => t.detail.includes('Cache hit skipped')));
  assert.ok(state.requests.at(-1).trace.some(t => t.detail.includes('Return over')));
});
test('load balancer routes only to healthy instances and fails when none remain', () => {
  const design = graph(); let state = engine.toggleLabFailure(engine.createLabState(design), design, 'amber', 'node');
  state = engine.sendLabRequests(state, design, 6, profile); state = advance(state, design);
  assert.equal(state.succeeded, 6); assert.equal(state.nodes.amber.processed, 0); assert.equal(state.nodes.green.processed, 6);
  state = engine.toggleLabFailure(state, design, 'green', 'node'); state = engine.sendLabRequests(state, design, 1, profile); state = advance(state, design);
  assert.equal(state.failed, 1); assert.match(state.requests.at(-1).reason, /no healthy routing target/);
});
test('worker outage preserves queued messages, then recovery drains and acknowledges them', () => {
  const design = graph(); let state = engine.toggleLabFailure(engine.createLabState(design), design, 'consumer', 'node');
  state = engine.sendLabRequests(state, design, 4, profile); state = advance(state, design, 2000);
  assert.equal(state.succeeded, 4); assert.equal(state.nodes.buffer.messages.length, 4); assert.equal(state.nodes.buffer.acknowledged, 0);
  state = engine.toggleLabFailure(state, design, 'consumer', 'node'); state = advance(state, design);
  assert.equal(state.nodes.buffer.messages.length, 0); assert.equal(state.nodes.buffer.acknowledged, 4); assert.equal(Object.keys(state.tasks).length, 0);
});
test('background failure retries finitely then dead-letters without failing the foreground response', () => {
  const design = graph(); design.nodes.find(n => n.id === 'consumer').simulation = { failureRate: 1 };
  let state = engine.sendLabRequests(engine.createLabState(design), design, 1, profile); state = advance(state, design);
  assert.equal(state.succeeded, 1); assert.equal(state.failed, 0); assert.equal(state.retries, 2); assert.equal(state.deadLetters, 1); assert.equal(state.nodes.buffer.acknowledged, 0);
});
test('buffer limits and deadlines fail requests and release every occupied slot', () => {
  const design = { version: 1, title: 'Capacity', nodes: [node('desktop','Client'), node('slow','API server',{ concurrency: 1, capacity: 0, latencyMs: 1000 })], edges: [edge('desktop','slow')] };
  let state = engine.sendLabRequests(engine.createLabState(design), design, 5, { ...profile, timeoutMs: 300 }); state = advance(state, design, 3000);
  assert.equal(state.failed, 5); assert.equal(state.nodes.slow.rejected, 4); assert.equal(state.nodes.slow.active.length, 0); assert.equal(state.nodes.desktop.active.length, 0); assert.equal(Object.keys(state.tasks).length, 0);
});
test('configured fallback handles a cache outage; no fallback means a failed request', () => {
  const design = graph(); for (const link of design.edges) if (link.to === 'records') link.simulation.mode = 'fallback';
  let state = engine.toggleLabFailure(engine.createLabState(design), design, 'lookup', 'node'); state = engine.sendLabRequests(state, design, 1, profile); state = advance(state, design);
  assert.equal(state.succeeded, 1); assert.ok(state.requests[0].trace.some(t => t.detail.includes('Using fallback')));
  const plain = graph(); state = engine.toggleLabFailure(engine.createLabState(plain), plain, 'lookup', 'node'); state = engine.sendLabRequests(state, plain, 1, profile); state = advance(state, plain);
  assert.equal(state.failed, 1);
});
test('synchronous cycles and broken connections fail rather than silently looping', () => {
  const design = {version:1,title:'Cycle',nodes:[node('desktop','Client'),node('first','API server'),node('second','API server')],edges:[edge('desktop','first'),edge('first','second'),edge('second','first')]};
  let state = engine.sendLabRequests(engine.createLabState(design), design, 1, profile); state = advance(state, design);
  assert.equal(state.failed,1); assert.match(state.requests[0].reason,/cycle/);
  state = engine.toggleLabFailure(engine.createLabState(design), design, 'desktop-first','link'); state = engine.sendLabRequests(state, design,1,profile); state=advance(state,design);
  assert.equal(state.failed,1); assert.match(state.requests[0].reason,/unavailable/);
});
test('same graph, workload, faults and seed produce identical replay results', () => {
  const design=graph(); const run=()=> { let state=engine.setLabTraffic(engine.createLabState(design,123),design,profile); state=advance(state,design,300); state=engine.randomLabFailure(state,design); return advance(state,design,10000); };
  assert.equal(JSON.stringify(run()),JSON.stringify(run()));
});
test('traffic request keys are reproducible when component latency changes', () => {
  const first=graph(), second=graph(); second.nodes.find(n=>n.id==='records').simulation={latencyMs:300};
  const run=design=>advance(engine.setLabTraffic(engine.createLabState(design,42),design,{...profile,keySpace:10}),design,1000).requests.map(r=>[r.key,r.read]);
  assert.equal(JSON.stringify(run(first)),JSON.stringify(run(second)));
});
test('simulation rules survive shares while invalid imports are rejected', () => {
  const design=graph(); design.nodes[0].simulation={latencyMs:10,concurrency:5,untrusted:'discard'};
  const parsed=designApi.parseDesign(design); assert.equal(parsed.nodes[0].simulation.untrusted,undefined);
  assert.equal(JSON.stringify(designApi.decodeDesign(designApi.encodeDesign(parsed))),JSON.stringify(parsed));
  for(const bad of [null,0,false,{concurrency:0},{failureRate:2},{capacity:Infinity},{routing:'magic'}]) { const sample=graph(); sample.nodes[0].simulation=bad; assert.throws(()=>designApi.parseDesign(sample)); }
});
