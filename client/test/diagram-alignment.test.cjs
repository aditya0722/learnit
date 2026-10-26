const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/diagram-alignment.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context);
const { alignComponent } = context.exports;
const n = (id, x, y) => ({ id, x, y, type: 'API server', label: id });

test('aligns rows, columns and opposite footprint edges without moving neighbors', () => {
  const nodes = [n('a', 200, 100)];
  assert.equal(alignComponent(n('moving', 203, 300), nodes, 1000, 600).x, 200);
  assert.equal(alignComponent(n('moving', 500, 104), nodes, 1000, 600).y, 100);
  assert.equal(alignComponent(n('moving', 311, 300), nodes, 1000, 600).x, 308);
  assert.equal(nodes[0].x, 200);
});
test('matches horizontal and vertical gaps and inserts evenly between two components', () => {
  const row = [n('a', 100, 100), n('b', 300, 100)];
  const next = alignComponent(n('moving', 504, 102), row, 1000, 600);
  assert.equal(next.x, 500); assert.equal(next.y, 100);
  assert.equal(next.guides.filter(g => g.equal && g.gap === 92).length, 2);
  assert.equal(alignComponent(n('moving', 303, 100), [n('a', 100, 100), n('b', 500, 100)], 1000, 600).x, 300);
  const column = alignComponent(n('moving', 103, 403), [n('a', 100, 100), n('b', 100, 250)], 1000, 600);
  assert.equal(column.y, 400);
  assert.equal(column.guides.filter(g => g.equal && g.gap === 60).length, 2);
});
test('uses supplied zoom tolerance, ignores self, and supports free movement', () => {
  const nodes = [n('a', 100, 100), n('moving', 300, 300)];
  assert.equal(alignComponent(n('moving', 104, 300), nodes, 1000, 600, 2).x, 104);
  const free = alignComponent(n('moving', 104, 303), nodes, 1000, 600, 6, false);
  assert.equal(free.x, 104); assert.equal(free.y, 303); assert.equal(free.guides.length, 0);
  assert.equal(alignComponent(n('moving', 303, 303), nodes, 1000, 600).x, 303);
});
test('clamps to canvas and never snaps out of bounds or repeats an overlapping gap', () => {
  const placed = alignComponent(n('moving', -8, 800), [n('a', -3, 100)], 1000, 600);
  assert.equal(placed.x, 0); assert.equal(placed.y, 510);
  const overlap = alignComponent(n('moving', 200, 100), [n('a', 100, 100), n('b', 300, 100)], 1000, 600);
  assert.equal(overlap.guides.some(g => g.equal), false);
});
