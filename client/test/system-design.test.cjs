const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../lib/system-design.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const context = { exports: {}, TextEncoder, TextDecoder, btoa, atob };
vm.runInNewContext(compiled, context);
const { parseDesign, encodeDesign, decodeDesign, initialDesign, lessons } = context.exports;
const caseSource = fs.readFileSync(path.join(__dirname, '../lib/system-design-cases.ts'), 'utf8');
const caseCompiled = ts.transpileModule(caseSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const caseLayoutContext = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/system-design-case-layout.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, caseLayoutContext);
const caseContext = { exports: {}, require: name => { assert.equal(name, './system-design-case-layout'); return caseLayoutContext.exports; } };
vm.runInNewContext(caseCompiled, caseContext);
const { systemCases, caseDesign } = caseContext.exports;
const layoutCompiled = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/architecture-layout.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const layoutContext = { exports: {}, require: name => { assert.equal(name, './system-design'); return context.exports; } };
vm.runInNewContext(layoutCompiled, layoutContext);
const { architectureScene } = layoutContext.exports;
const templateSource = fs.readFileSync(path.join(__dirname, '../lib/system-design-templates.ts'), 'utf8');
const templateCompiled = ts.transpileModule(templateSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const templateContext = { exports: {}, require: name => { assert.equal(name, './system-design'); return context.exports; } };
vm.runInNewContext(templateCompiled, templateContext);
const { simpleDesign, lessonArchitecture } = templateContext.exports;
const fresh = () => JSON.parse(JSON.stringify(initialDesign));

test('dragged connection sides survive sharing and remain attached to the selected ports', () => {
  const { connectionSides, connectionAnchor } = context.exports;
  for (const fromPort of connectionSides) for (const toPort of connectionSides) {
    const design = fresh();
    design.edges[0].fromPort = fromPort;
    design.edges[0].toPort = toPort;
    const shared = decodeDesign(encodeDesign(design));
    assert.equal(shared.edges[0].fromPort, fromPort);
    assert.equal(shared.edges[0].toPort, toPort);
    const scene = architectureScene(shared, { preserveCoordinates: true });
    const route = scene.routes[0];
    assert.deepEqual(Array.from(route.points[0]), Array.from(connectionAnchor(route.from, fromPort)));
    assert.deepEqual(Array.from(route.points.at(-1)), Array.from(connectionAnchor(route.to, toPort)));
    for (let i = 1; i < route.points.length; i++) {
      assert.ok(route.points[i][0] === route.points[i - 1][0] || route.points[i][1] === route.points[i - 1][1]);
    }
  }
});

test('imports reject invalid connection ports without affecting older diagrams', () => {
  assert.doesNotThrow(() => parseDesign(fresh()));
  for (const key of ['fromPort', 'toPort']) for (const invalid of ['center', '', null, 2, {}]) {
    const design = fresh(); design.edges[0][key] = invalid;
    assert.throws(() => parseDesign(design), /connection side/);
  }
});

test('every catalog component survives import and snapshot sharing', () => {
  const { componentCatalog, componentTypes } = context.exports;
  assert.ok(componentTypes.includes('API gateway'));
  assert.equal(new Set(componentTypes).size, componentTypes.length);
  const design = fresh();
  design.nodes = Array.from(componentCatalog, (c, i) => ({ id: `catalog-${i}`, type: c.type, label: c.type, x: 100, y: 100 }));
  design.edges = [];
  assert.equal(JSON.stringify(decodeDesign(encodeDesign(parseDesign(design)))), JSON.stringify(parseDesign(design)));
});

test('editor placements keep their coordinates as the diagram grows past twelve components', () => {
  const design = fresh();
  design.nodes = Array.from({ length: 13 }, (_, i) => ({ id: `service-${i}`, type: 'API gateway', label: 'Gateway', x: 50 + i * 30, y: 250 }));
  design.edges = [];
  const scene = architectureScene(design, { preserveCoordinates: true });
  assert.equal(scene.scaleX, 1);
  assert.equal(scene.scaleY, 1);
  for (let i = 0; i < design.nodes.length; i++) {
    assert.equal(scene.nodes[i].x, design.nodes[i].x);
    assert.equal(scene.nodes[i].y, design.nodes[i].y);
  }
});
test('share links preserve Unicode labels and geometry', () => {
  const design = fresh(); design.title = 'पाठ्यक्रम architecture'; design.nodes[0].label = 'Student 🌍';
  assert.equal(JSON.stringify(decodeDesign(encodeDesign(design))), JSON.stringify(design));
});
test('imports reject invalid identities, positions, types and references', () => {
  for (const alter of [d => d.nodes.push(d.nodes[0]), d => d.nodes[0].x = Infinity, d => d.nodes[0].y = -1, d => d.nodes[0].type = 'Unknown', d => d.edges[0].to = 'missing', d => d.edges[0].to = d.edges[0].from, d => d.nodes[0] = null, d => d.edges[0] = null]) {
    const design = fresh(); alter(design); assert.throws(() => parseDesign(design));
  }
  assert.throws(() => decodeDesign('bad share link'));
  assert.throws(() => parseDesign({ ...fresh(), version: 2 }));
});
test('imports discard arbitrary properties and cap design size', () => {
  const design = fresh(); design.extra = 'untrusted'; design.nodes[0].extra = 'untrusted';
  const parsed = parseDesign(design); assert.equal(parsed.extra, undefined); assert.equal(parsed.nodes[0].extra, undefined);
  assert.throws(() => parseDesign({ ...fresh(), nodes: Array(81).fill(design.nodes[0]) }));
});
test('all eight chapters have matching walkthroughs and valid answer indexes', () => {
  assert.equal(lessons.length, 8);
  for (const lesson of lessons) { assert.equal(lesson.steps.length, lesson.flow.length); assert.ok(lesson.answer >= 0 && lesson.answer < lesson.options.length); assert.ok(lesson.assignment.length > 30); }
});
test('all advanced cases export valid editable diagrams and preserve share snapshots', () => {
  assert.deepEqual(Array.from(systemCases, c => c.id), ['uber', 'netflix', 'hotstar', 'youtube']);
  for (const model of systemCases) {
    const design = parseDesign(caseDesign(model));
    assert.ok(design.nodes.length >= 15);
    assert.equal(JSON.stringify(decodeDesign(encodeDesign(design))), JSON.stringify(design));
    const pairs = new Set(design.edges.map(e => e.from + ':' + e.to));
    assert.equal(pairs.size, design.edges.length);
    for (const n of design.nodes) assert.ok(design.edges.some(e => e.from === n.id || e.to === n.id), model.id + ': disconnected ' + n.id);
  }
});
test('every scenario references real nodes and explains its payload and design rationale', () => {
  let count = 0;
  for (const model of systemCases) {
    const ids = new Set(model.nodes.map(n => n.id));
    assert.equal(model.scenarios.length, 3);
    assert.ok(model.scenarios.some(s => s.id === 'failure'));
    for (const scenario of model.scenarios) {
      count++;
      assert.ok(scenario.steps.length >= 5);
      for (const step of scenario.steps) {
        assert.ok(ids.has(step.from) && ids.has(step.to));
        assert.notEqual(step.from, step.to);
        assert.ok(step.detail.length > 60 && step.why.length > 50 && step.payload.length > 15);
        assert.ok(['request', 'response', 'event', 'media', 'failure'].includes(step.kind));
      }
      if (scenario.id === 'failure') assert.ok(scenario.steps.some(s => s.kind === 'failure'));
    }
  }
  assert.equal(count, 12);
});
test('generated architectures preserve service, flow and region metadata through share links', () => {
  for (const original of [simpleDesign, ...lessons.map((_, i) => lessonArchitecture(i))]) {
    const design = parseDesign(original);
    assert.ok(design.groups.length);
    assert.ok(design.edges.every(e => e.label && e.kind));
    assert.equal(JSON.stringify(decodeDesign(encodeDesign(design))), JSON.stringify(design));
  }
  assert.equal(simpleDesign.groups.filter(g => g.kind === 'region').length, 1);
  assert.ok(simpleDesign.edges.some(e => e.kind === 'event'));
  const cache = lessonArchitecture(2);
  assert.ok(cache.edges.some(e => e.from === 'lesson-1' && e.to === 'lesson-2'));
  assert.ok(cache.edges.some(e => e.from === 'lesson-1' && e.to === 'lesson-3'));
  assert.equal(lessonArchitecture(7).nodes.length, 9);
});
test('imports reject malformed boundaries and connection metadata', () => {
  for (const alter of [d => d.groups[0].width = 2000, d => d.groups[0].y = -1, d => d.groups[0].kind = 'unknown', d => d.groups.push(d.groups[0]), d => d.nodes[0].groupId = 'missing', d => d.nodes[0].service = {}, d => d.edges[0].kind = 'unknown', d => d.edges[0].label = 'x'.repeat(61)]) {
    const design = JSON.parse(JSON.stringify(simpleDesign)); alter(design); assert.throws(() => parseDesign(design));
  }
});
test('orthogonal routing avoids intervening service cards and keeps labels on the route', () => {
  const { connectionPoints, connectionLabelPosition, nodeBounds } = context.exports;
  const blocker = nodeBounds({ x: 350, y: 190 });
  const nodes = [ { id: 'a', type: 'Client', label: 'A', x: 35, y: 190 }, { id: 'blocker', type: 'Database', label: 'Middle', x: 350, y: 190 }, { id: 'b', type: 'API server', label: 'B', x: 710, y: 190 } ];
  const points = connectionPoints(nodes[0], nodes[2], nodes);
  assert.ok(points.length > 2);
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    assert.ok(a[0] === b[0] || a[1] === b[1], 'segments must be orthogonal');
    assert.ok(!(a[0] === b[0] ? a[0] > blocker.x && a[0] < blocker.x + blocker.width && Math.max(a[1], b[1]) > 190 && Math.min(a[1], b[1]) < 280 : a[1] > 190 && a[1] < 280 && Math.max(a[0], b[0]) > blocker.x && Math.min(a[0], b[0]) < blocker.x + blocker.width), 'route crosses intervening card');
  }
  const label = connectionLabelPosition(nodes[0], nodes[2], nodes);
  assert.ok(Number.isFinite(label.x) && Number.isFinite(label.y));
});
test('generated request paths avoid unrelated service cards across all templates', () => {
  const { connectionPoints } = context.exports;
  const originals = [simpleDesign, ...lessons.map((_, i) => lessonArchitecture(i)), ...systemCases.map(caseDesign)];
  for (const design of [...originals, ...originals.map(d => ({ ...d, nodes: architectureScene(d).nodes }))]) {
    for (const edge of design.edges) {
      const points = connectionPoints(design.nodes.find(n => n.id === edge.from), design.nodes.find(n => n.id === edge.to), design.nodes);
      for (const candidate of design.nodes.filter(n => n.id !== edge.from && n.id !== edge.to)) {
        const node = { ...candidate, ...context.exports.nodeBounds(candidate) };
        for (let i = 1; i < points.length; i++) {
          const a = points[i - 1], b = points[i];
          const crosses = a[0] === b[0] ? a[0] > node.x && a[0] < node.x + node.width && Math.max(a[1], b[1]) > node.y && Math.min(a[1], b[1]) < node.y + node.height : a[1] > node.y && a[1] < node.y + node.height && Math.max(a[0], b[0]) > node.x && Math.min(a[0], b[0]) < node.x + node.width;
          assert.ok(!crosses, `${design.title}: ${edge.from} → ${edge.to} crosses ${node.id}`);
        }
      }
    }
  }
});

test('display layout preserves editable geometry and keeps dense nodes inside their zones', () => {
  for (const model of systemCases) {
    const design = caseDesign(model), before = JSON.stringify(design), scene = architectureScene(design);
    assert.equal(JSON.stringify(design), before);
    for (const n of scene.nodes) {
      const saved = design.nodes.find(v => v.id === n.id);
      assert.ok(Math.abs((n.x + 80) / scene.scaleX - 80 - saved.x) < .001);
      assert.ok(Math.abs((n.y - scene.offsetY) / scene.scaleY - saved.y) < .001);
      const zone = scene.groups.find(g => g.id === n.groupId);
      assert.ok(n.x + 26 > zone.x && n.x + 134 < zone.x + zone.width);
      assert.ok(n.y > zone.y + 20 && n.y + 105 < zone.y + zone.height);
    }
  }
});
