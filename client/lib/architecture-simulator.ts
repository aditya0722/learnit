import { componentBehavior, type Design, type DesignEdge, type DesignNode } from "./system-design";

export type NodeRules = { latencyMs: number; jitterMs: number; concurrency: number; capacity: number; ttlMs: number; retryLimit: number; failureRate: number; routing: "round-robin" | "least-connections" };
export type TrafficSettings = { entry: string; rps: number; keySpace: number; readPercent: number; timeoutMs: number; durationMs: number };
export type TraceEntry = { at: number; node?: string; detail: string };
export type LabRequest = { id: number; key: string; read: boolean; start: number; end?: number; status: "pending" | "success" | "failed"; reason?: string; trace: TraceEntry[] };
type Frame = { node: string; via?: string; cursor: number; edges: string[]; hit?: boolean; cache?: string; result?: "hit" | "miss"; fallbackUsed?: boolean };
export type LabTask = { id: number; request: number; key: string; read: boolean; background: boolean; stack: Frame[]; stage: "processing" | "waiting" | "travel" | "queued"; node: string; hops: number; owner?: string; attempt: number; transit?: { edge: string; start: number; end: number; reverse: boolean }; version: number };
export type RuntimeNode = { down: boolean; active: number[]; waiting: { task: number; via?: string }[]; messages: number[]; entries: Record<string, { expires: number; stored: number }>; processed: number; rejected: number; failures: number; hits: number; misses: number; turn: number; deadLetters: number; acknowledged: number; retries: number };
type Event = { at: number; sequence: number; kind: "arrival" | "processed" | "returned" | "timeout" | "traffic" | "retry"; task?: number; version?: number; node?: string; edge?: string; request?: number; generation?: number };
export type LabState = {
  time: number; seed: number; rng: number; trafficRng: number; nextRequest: number; nextTask: number; sequence: number;
  nodes: Record<string, RuntimeNode>; brokenLinks: string[]; tasks: Record<number, LabTask>; requests: LabRequest[]; events: Event[];
  traffic: TrafficSettings | null; trafficEnd: number; generation: number;
  offered: number; succeeded: number; failed: number; backgroundCompleted: number; backgroundFailed: number; retries: number; deadLetters: number;
  latencies: number[]; failures: { at: number; target: string; kind: "node" | "link"; down: boolean }[]; warnings: string[];
};
export const MAX_ACTIVE_REQUESTS = 500;
const MAX_TASKS = 2000;

export function nodeRules(node: DesignNode): NodeRules {
  const latencyMs = componentBehavior(node.type) === "Database" ? 90 : componentBehavior(node.type) === "Worker" ? 350 : componentBehavior(node.type) === "Cache" || componentBehavior(node.type) === "CDN" ? 15 : componentBehavior(node.type) === "Client" ? 0 : 45;
  const gateway = ["Client", "Load balancer", "Cache", "CDN", "Queue", "Event bus"].includes(componentBehavior(node.type));
  return { latencyMs, jitterMs: 0, concurrency: componentBehavior(node.type) === "Worker" ? 1 : gateway ? 1000 : 8, capacity: 100, ttlMs: 20000, retryLimit: 2, failureRate: 0, routing: "round-robin", ...node.simulation };
}
export function edgeMode(edge: DesignEdge) {
  const mode = edge.simulation?.mode;
  if (mode && mode !== "auto") return mode;
  return edge.kind === "response" ? "ignore" : edge.kind === "failure" ? "fallback" : edge.kind === "event" || edge.kind === "replication" ? "async" : "call";
}
export function graphWarnings(design: Design): string[] {
  const warnings: string[] = [];
  if (!design.nodes.some(n => componentBehavior(n.type) === "Client" && design.edges.some(e => e.from === n.id && edgeMode(e) !== "ignore"))) warnings.push("Choose an entry component with an outgoing connection. A client is the usual entry.");
  for (const node of design.nodes) {
    const outgoing = design.edges.filter(e => e.from === node.id && edgeMode(e) !== "ignore");
    if (componentBehavior(node.type) === "Queue" && !outgoing.some(e => componentBehavior(design.nodes.find(n => n.id === e.to)!.type) === "Worker")) warnings.push(`${node.label}: no worker consumer connected; messages will remain buffered.`);
    if (componentBehavior(node.type) === "Load balancer" && !outgoing.some(e => edgeMode(e) === "call")) warnings.push(`${node.label}: no callable target connected.`);
    if (["Cache", "CDN"].includes(componentBehavior(node.type)) && !outgoing.length && !design.edges.some(e => e.to === node.id && design.edges.some(other => other.from === e.from && ["Database", "Object storage"].includes(componentBehavior(design.nodes.find(n => n.id === other.to)!.type))))) warnings.push(`${node.label}: misses have no backing storage path.`);
  }
  warnings.push("Default service calls are sequential. Cache-first uses the request key; explicit connection policies override inferred routing. Response edges are implicit returns; replication and events are background calls.");
  return warnings;
}
export function createLabState(design: Design, seed = 42): LabState {
  return {
    time: 0, seed: seed >>> 0, rng: seed >>> 0, trafficRng: (seed ^ 0x9e3779b9) >>> 0, nextRequest: 1, nextTask: 1, sequence: 0,
    nodes: Object.fromEntries(design.nodes.map(n => [n.id, { down: false, active: [], waiting: [], messages: [], entries: {}, processed: 0, rejected: 0, failures: 0, hits: 0, misses: 0, turn: 0, deadLetters: 0, acknowledged: 0, retries: 0 }])),
    brokenLinks: [], tasks: {}, requests: [], events: [], traffic: null, trafficEnd: 0, generation: 0,
    offered: 0, succeeded: 0, failed: 0, backgroundCompleted: 0, backgroundFailed: 0, retries: 0, deadLetters: 0, latencies: [], failures: [], warnings: graphWarnings(design),
  };
}
function random(s: LabState) { s.rng = (Math.imul(s.rng, 1664525) + 1013904223) >>> 0; return s.rng / 4294967296; }
function trafficRandom(s: LabState) { s.trafficRng = (Math.imul(s.trafficRng, 1664525) + 1013904223) >>> 0; return s.trafficRng / 4294967296; }
function schedule(s: LabState, event: Omit<Event, "sequence">) {
  const next = { ...event, sequence: s.sequence++ };
  let low = 0, high = s.events.length;
  while (low < high) { const mid = (low + high) >>> 1; if (s.events[mid].at <= next.at) low = mid + 1; else high = mid; }
  s.events.splice(low, 0, next);
}
function trace(s: LabState, task: LabTask, detail: string, node = task.node) {
  const request = s.requests.find(r => r.id === task.request);
  if (request && request.trace.length < 120) request.trace.push({ at: s.time, node, detail: task.background ? `[background T${task.id}] ${detail}` : detail });
}
function trimRequests(s: LabState) {
  const terminal = s.requests.filter(r => r.status !== "pending").slice(-100);
  s.requests = [...s.requests.filter(r => r.status === "pending"), ...terminal].sort((a, b) => a.id - b.id);
}
function release(s: LabState, task: LabTask, frame: Frame) {
  const runtime = s.nodes[frame.node];
  runtime.active = runtime.active.filter(id => id !== task.id);
}
function finish(s: LabState, task: LabTask, success: boolean, reason?: string) {
  for (const frame of task.stack) release(s, task, frame);
  for (const runtime of Object.values(s.nodes)) {
    runtime.waiting = runtime.waiting.filter(w => w.task !== task.id);
    runtime.messages = runtime.messages.filter(id => id !== task.id);
  }
  if (task.background) {
    if (success) { s.backgroundCompleted++; if (task.owner) { s.nodes[task.owner].acknowledged++; trace(s, task, "Worker acknowledged the message", task.owner); } }
    else s.backgroundFailed++;
  }
  else {
    const request = s.requests.find(r => r.id === task.request);
    if (request && request.status === "pending") {
      request.status = success ? "success" : "failed"; request.end = s.time; request.reason = reason;
      trace(s, task, success ? "Response completed" : `Request failed: ${reason}`);
      if (success) { s.succeeded++; s.latencies.push(s.time - request.start); if (s.latencies.length > 2000) s.latencies.shift(); }
      else s.failed++;
    }
  }
  delete s.tasks[task.id]; trimRequests(s);
}
function storeCache(s: LabState, design: Design, nodeId: string, key: string) {
  const node = design.nodes.find(n => n.id === nodeId)!, rules = nodeRules(node), runtime = s.nodes[nodeId];
  if (runtime.down || rules.capacity === 0) return;
  for (const [entry, value] of Object.entries(runtime.entries)) if (value.expires <= s.time) delete runtime.entries[entry];
  const keys = Object.keys(runtime.entries);
  if (!runtime.entries[key] && keys.length >= rules.capacity) {
    keys.sort((a, b) => runtime.entries[a].stored - runtime.entries[b].stored); delete runtime.entries[keys[0]];
  }
  runtime.entries[key] = { expires: s.time + rules.ttlMs, stored: s.time };
}
function travel(s: LabState, task: LabTask, edge: DesignEdge, reverse = false) {
  task.stage = "travel"; task.version++; task.hops++;
  if (task.hops > 64) { fail(s, task, "Hop limit exceeded; check for a routing cycle", currentDesign!); return; }
  const latency = edge.simulation?.latencyMs ?? 120;
  task.transit = { edge: edge.id, start: s.time, end: s.time + latency, reverse };
  trace(s, task, `${reverse ? "Return" : "Call"} over ${edge.label || edge.id}`, reverse ? edge.to : edge.from);
  schedule(s, { at: s.time + latency, kind: reverse ? "returned" : "arrival", task: task.id, version: task.version, node: edge.to, edge: edge.id });
}
// Each public operation sets the immutable graph used by nested continuations.
let currentDesign: Design | null = null;
function admit(s: LabState, task: LabTask, nodeId: string, design: Design, via?: string) {
  const node = design.nodes.find(n => n.id === nodeId);
  if (!node) { fail(s, task, "Destination component is missing", design); return; }
  task.node = nodeId; task.transit = undefined;
  const runtime = s.nodes[nodeId], rules = nodeRules(node);
  if (runtime.down) { fail(s, task, `${node.label} is down`, design); return; }
  if (task.stack.some(frame => frame.node === nodeId)) { fail(s, task, `Synchronous call cycle at ${node.label}`, design); return; }
  if (runtime.active.length >= rules.concurrency) {
    if (runtime.waiting.length >= rules.capacity) { runtime.rejected++; fail(s, task, `${node.label} waiting buffer is full`, design); return; }
    runtime.waiting.push({ task: task.id, via }); task.stage = "waiting"; trace(s, task, `Waiting for an available slot at ${node.label}`); return;
  }
  runtime.active.push(task.id);
  task.stack.push({ node: nodeId, via, cursor: 0, edges: [] }); task.stage = "processing"; task.version++;
  trace(s, task, `${node.label} processing ${task.read ? "read" : "write"} ${task.key}`);
  schedule(s, { at: s.time + rules.latencyMs + random(s) * rules.jitterMs, kind: "processed", task: task.id, version: task.version });
}
function completeFrame(s: LabState, task: LabTask, design: Design) {
  const frame = task.stack.pop()!, runtime = s.nodes[frame.node]; runtime.processed++; release(s, task, frame);
  const parent = task.stack[task.stack.length - 1];
  if (parent) {
    if (frame.result) { parent.hit = frame.result === "hit"; if (!parent.hit) parent.cache = frame.node; }
    const node = design.nodes.find(n => n.id === frame.node)!;
    if (parent.cache && task.read && ["Database", "Object storage"].includes(componentBehavior(node.type))) { storeCache(s, design, parent.cache, task.key); trace(s, task, `Filled cache ${parent.cache} after successful storage read`, parent.cache); parent.hit = true; if (["Cache", "CDN"].includes(componentBehavior(design.nodes.find(n => n.id === parent.node)!.type))) parent.result = "hit"; }
    if (frame.via) { travel(s, task, design.edges.find(e => e.id === frame.via)!, true); return; }
    continueFrame(s, task, design);
  } else {
    if (task.owner && frame.via) travel(s, task, design.edges.find(e => e.id === frame.via)!, true);
    else finish(s, task, true);
  }
}
function spawn(s: LabState, source: LabTask, design: Design, edge: DesignEdge) {
  if (Object.keys(s.tasks).length >= MAX_TASKS) { s.backgroundFailed++; trace(s, source, "Background task limit reached"); return; }
  const id = s.nextTask++;
  const task: LabTask = { id, request: source.request, key: source.key, read: source.read, background: true, stack: [], node: edge.from, stage: "travel", hops: source.hops, attempt: 0, version: 0 };
  s.tasks[id] = task; travel(s, task, edge); trace(s, source, `Published background task T${id}`, edge.from);
}
function continueFrame(s: LabState, task: LabTask, design: Design) {
  const frame = task.stack[task.stack.length - 1]; if (!frame) { finish(s, task, true); return; }
  task.node = frame.node;
  while (frame.cursor < frame.edges.length) {
    const edgeId = frame.edges[frame.cursor++];
    const edge = design.edges.find(e => e.id === edgeId)!, mode = edgeMode(edge), target = design.nodes.find(n => n.id === edge.to)!;
    if (mode === "ignore" || mode === "fallback" || (mode === "cache-hit" && !frame.hit) || (mode === "cache-miss" && frame.hit)) continue;
    // An API connected to both a cache and storage uses cache-aside by default.
    if ((edge.simulation?.mode === undefined || edge.simulation.mode === "auto") && frame.hit && task.read && ["Database", "Object storage"].includes(componentBehavior(target.type))) { trace(s, task, `Cache hit skipped ${target.label}`, frame.node); continue; }
    if (mode === "async") { spawn(s, task, design, edge); continue; }
    travel(s, task, edge); return;
  }
  completeFrame(s, task, design);
}
function fail(s: LabState, task: LabTask, reason: string, design: Design) {
  trace(s, task, reason);
  task.version++; task.transit = undefined;
  const failingNode = task.node;
  if (s.nodes[failingNode]) s.nodes[failingNode].failures++;
  for (const runtime of Object.values(s.nodes)) runtime.waiting = runtime.waiting.filter(w => w.task !== task.id);
  const failedFrame = task.stack.findIndex(frame => frame.node === failingNode);
  if (failedFrame >= 0) for (const frame of task.stack.splice(failedFrame)) release(s, task, frame);
  // A healthy caller may use an explicitly connected fallback; failed services cannot execute their own policy.
  while (task.stack.length) {
    const frame = task.stack[task.stack.length - 1];
    const fallback = frame.node !== failingNode && !s.nodes[frame.node].down && !frame.fallbackUsed ? design.edges.find(e => e.from === frame.node && edgeMode(e) === "fallback" && !s.nodes[e.to].down) : undefined;
    if (fallback) { frame.fallbackUsed = true; frame.cursor = frame.edges.length; trace(s, task, `Using fallback after ${reason}`, frame.node); travel(s, task, fallback); return; }
    release(s, task, task.stack.pop()!);
  }
  for (const runtime of Object.values(s.nodes)) runtime.waiting = runtime.waiting.filter(w => w.task !== task.id);
  if (task.owner) {
    const queue = s.nodes[task.owner], rules = nodeRules(design.nodes.find(n => n.id === task.owner)!);
    if (task.attempt < rules.retryLimit) {
      task.attempt++; task.version++; task.stage = "queued"; task.node = task.owner;
      queue.retries++; s.retries++;
      trace(s, task, `No ACK; retry ${task.attempt}/${rules.retryLimit} after backoff`, task.owner);
      schedule(s, { at: s.time + Math.min(5000, 200 * 2 ** (task.attempt - 1)) + random(s) * 100, kind: "retry", task: task.id, version: task.version }); return;
    }
    queue.deadLetters++; s.deadLetters++; trace(s, task, "Retry limit reached; sent to dead-letter queue", task.owner);
  }
  finish(s, task, false, reason);
}
function processNode(s: LabState, task: LabTask, design: Design) {
  const frame = task.stack[task.stack.length - 1], node = design.nodes.find(n => n.id === frame.node)!, runtime = s.nodes[node.id], rules = nodeRules(node);
  if (runtime.down || random(s) < rules.failureRate) { fail(s, task, `${node.label} failed while processing`, design); return; }
  if (componentBehavior(node.type) === "Queue") {
    if (runtime.messages.length >= rules.capacity || Object.keys(s.tasks).length >= MAX_TASKS) { runtime.rejected++; fail(s, task, `${node.label} message buffer is full`, design); return; }
    const id = s.nextTask++;
    const job: LabTask = { id, request: task.request, key: task.key, read: task.read, background: true, stack: [], node: node.id, stage: "queued", owner: node.id, attempt: 0, hops: task.hops, version: 0 };
    s.tasks[id] = job; runtime.messages.push(id); trace(s, task, `Enqueued message T${id}; sender can continue`); completeFrame(s, task, design); return;
  }
  if (["Cache", "CDN"].includes(componentBehavior(node.type))) {
    if (!task.read) { delete runtime.entries[task.key]; frame.result = "miss"; trace(s, task, `Invalidated ${task.key}`); }
    else if (runtime.entries[task.key]?.expires > s.time) { runtime.hits++; frame.result = "hit"; frame.hit = true; trace(s, task, `HIT ${task.key}; backing storage skipped`); }
    else { delete runtime.entries[task.key]; runtime.misses++; frame.result = "miss"; frame.cache = node.id; trace(s, task, `MISS ${task.key}`); }
  }
  let edges = design.edges.filter(e => e.from === node.id && edgeMode(e) !== "ignore" && edgeMode(e) !== "fallback");
  if (componentBehavior(node.type) === "Client" && task.stack.length > 1) edges = [];
  if (componentBehavior(node.type) === "Cache" || componentBehavior(node.type) === "CDN") edges = edges.filter(e => frame.result === "hit" ? edgeMode(e) === "cache-hit" || edgeMode(e) === "async" : edgeMode(e) !== "cache-hit");
  if (["Cache", "CDN"].includes(componentBehavior(node.type)) && frame.result === "miss" && !edges.some(e => edgeMode(e) !== "async")) {
    const parent = task.stack[task.stack.length - 2];
    if (!parent || !parent.edges.slice(parent.cursor).some(id => { const mode = edgeMode(design.edges.find(e => e.id === id)!); return mode === "call" || mode === "cache-miss"; })) { fail(s, task, `${node.label}: cache miss has no backing storage call`, design); return; }
  }
  if (componentBehavior(node.type) === "Load balancer") {
    const candidates = edges.filter(e => ["call", "cache-hit", "cache-miss"].includes(edgeMode(e)) && !s.nodes[e.to].down && !s.brokenLinks.includes(e.id));
    if (!candidates.length) { fail(s, task, `${node.label}: no healthy routing target`, design); return; }
    const chosen = rules.routing === "least-connections" ? candidates.reduce((best, edge) => s.nodes[edge.to].active.length + s.nodes[edge.to].waiting.length < s.nodes[best.to].active.length + s.nodes[best.to].waiting.length ? edge : best) : candidates[runtime.turn++ % candidates.length];
    edges = [chosen, ...edges.filter(e => edgeMode(e) === "async")]; trace(s, task, `${rules.routing} selected ${design.nodes.find(n => n.id === chosen.to)!.label}`);
  } else if (componentBehavior(node.type) === "Event bus") {
    for (const edge of edges) spawn(s, task, design, edge);
    completeFrame(s, task, design); return;
  } else edges.sort((a, b) => Number(!["Cache", "CDN"].includes(design.nodes.find(n => n.id === a.to)!.type)) - Number(!["Cache", "CDN"].includes(design.nodes.find(n => n.id === b.to)!.type)));
  frame.edges = edges.map(e => e.id); continueFrame(s, task, design);
}
function pump(s: LabState, design: Design) {
  for (const node of design.nodes) {
    const runtime = s.nodes[node.id], rules = nodeRules(node); if (runtime.down) continue;
    while (runtime.waiting.length && runtime.active.length < rules.concurrency) {
      const item = runtime.waiting.shift()!, task = s.tasks[item.task]; if (task) admit(s, task, node.id, design, item.via);
    }
    if (componentBehavior(node.type) !== "Queue") continue;
    while (runtime.messages.length) {
      const workers = design.edges.filter(e => e.from === node.id && edgeMode(e) !== "ignore" && edgeMode(e) !== "fallback" && componentBehavior(design.nodes.find(n => n.id === e.to)!.type) === "Worker" && !s.nodes[e.to].down && !s.brokenLinks.includes(e.id));
      // Reserve a worker slot for in-flight deliveries to prevent draining the whole queue into a worker's local buffer.
      const available = workers.filter(e => s.nodes[e.to].active.length + Object.values(s.tasks).filter(t => t.owner && t.transit && !t.transit.reverse && design.edges.find(link => link.id === t.transit!.edge)?.to === e.to).length < nodeRules(design.nodes.find(n => n.id === e.to)!).concurrency);
      if (!available.length) break;
      const task = s.tasks[runtime.messages.shift()!]; if (!task) continue;
      const edge = available[runtime.turn++ % available.length]; trace(s, task, "FIFO message claimed by available worker", node.id); travel(s, task, edge);
    }
  }
}
function inject(s: LabState, design: Design, count: number, settings: TrafficSettings) {
  const entry = design.nodes.find(n => n.id === settings.entry);
  if (!entry) return;
  for (let i = 0; i < Math.min(500, Math.max(0, Math.floor(count))); i++) {
    const id = s.nextRequest++, key = `key:${1 + Math.floor(trafficRandom(s) * Math.max(1, settings.keySpace))}`, read = trafficRandom(s) * 100 < settings.readPercent;
    const request: LabRequest = { id, key, read, start: s.time, status: "pending", trace: [] }; s.requests.push(request); s.offered++;
    const task: LabTask = { id: s.nextTask++, request: id, key, read, background: false, stack: [], node: entry.id, stage: "processing", hops: 0, attempt: 0, version: 0 };
    s.tasks[task.id] = task;
    if (s.requests.filter(r => r.status === "pending").length > MAX_ACTIVE_REQUESTS || Object.keys(s.tasks).length > MAX_TASKS) { finish(s, task, false, "Simulator in-flight limit reached"); continue; }
    trace(s, task, `${read ? "READ" : "WRITE"} ${key} entered at ${entry.label}`);
    schedule(s, { at: s.time + settings.timeoutMs, kind: "timeout", request: id }); admit(s, task, entry.id, design);
  }
  pump(s, design); trimRequests(s);
}
export function sendLabRequests(state: LabState, design: Design, count: number, settings: TrafficSettings): LabState {
  const s = structuredClone(state); currentDesign = design; inject(s, design, count, settings); return s;
}
export function setLabTraffic(state: LabState, design: Design, settings: TrafficSettings | null): LabState {
  const s = structuredClone(state); currentDesign = design; s.generation++; s.traffic = settings;
  if (settings) { s.trafficEnd = s.time + settings.durationMs; schedule(s, { at: s.time, kind: "traffic", generation: s.generation }); }
  return s;
}
export function advanceLab(state: LabState, design: Design, milliseconds: number): LabState {
  const s = structuredClone(state); currentDesign = design;
  const target = s.time + Math.max(0, milliseconds); let processed = 0;
  while (s.events[0]?.at <= target && processed++ < 50000) {
    const event = s.events.shift()!; s.time = event.at;
    if (event.kind === "traffic") {
      if (s.traffic && event.generation === s.generation) {
        if (s.time < s.trafficEnd) { inject(s, design, 1, s.traffic); schedule(s, { at: s.time + 1000 / Math.max(1, s.traffic.rps), kind: "traffic", generation: s.generation }); }
        else s.traffic = null;
      }
    } else if (event.kind === "timeout") {
      const task = Object.values(s.tasks).find(t => !t.background && t.request === event.request);
      if (task) finish(s, task, false, "Client deadline exceeded");
    } else {
      const task = s.tasks[event.task!]; if (!task || task.version !== event.version) continue;
      if (event.kind === "retry") {
        const owner = s.nodes[task.owner!], rules = nodeRules(design.nodes.find(n => n.id === task.owner)!);
        if (owner.messages.length < rules.capacity) owner.messages.push(task.id);
        else { owner.deadLetters++; s.deadLetters++; finish(s, task, false, "Retry buffer is full"); }
      } else if (event.kind === "processed") processNode(s, task, design);
      else {
        const edge = design.edges.find(e => e.id === event.edge)!; task.transit = undefined;
        // Failure propagation belongs to the caller, rather than pretending a down destination can run fallback logic.
        task.node = edge.to;
        if (event.kind === "returned" && s.nodes[edge.from].down) { task.node = edge.from; fail(s, task, `Response destination ${edge.from} is down`, design); }
        else if (s.brokenLinks.includes(edge.id) || random(s) < (edge.simulation?.failureRate || 0)) fail(s, task, `Connection ${edge.label || edge.id} unavailable`, design);
        else if (event.kind === "arrival") admit(s, task, event.node!, design, edge.id);
        else continueFrame(s, task, design);
      }
    }
    pump(s, design);
  }
  if (processed >= 50000 && s.events[0]?.at <= target) { s.traffic = null; s.warnings = [...s.warnings, "Event processing limit reached. Pause and simplify cyclic background paths."]; }
  else s.time = target;
  for (const runtime of Object.values(s.nodes)) for (const [key, entry] of Object.entries(runtime.entries)) if (entry.expires <= s.time) delete runtime.entries[key];
  return s;
}
export function toggleLabFailure(state: LabState, design: Design, target: string, kind: "node" | "link"): LabState {
  const s = structuredClone(state); currentDesign = design;
  if (kind === "node" && !s.nodes[target]) return s;
  const down = kind === "node" ? !s.nodes[target].down : !s.brokenLinks.includes(target);
  if (kind === "node") {
    s.nodes[target].down = down;
    const node = design.nodes.find(n => n.id === target)!;
    if (down && ["Cache", "CDN"].includes(componentBehavior(node.type))) s.nodes[target].entries = {};
  } else s.brokenLinks = down ? [...s.brokenLinks, target] : s.brokenLinks.filter(id => id !== target);
  s.failures.push({ at: s.time, target, kind, down });
  if (down) for (const task of Object.values(s.tasks)) {
    if (!s.tasks[task.id] || task.stage === "queued") continue;
    if (kind === "node" ? task.stack.some(frame => frame.node === target) || task.node === target : task.transit?.edge === target) { task.node = kind === "node" ? target : task.node; fail(s, task, `${kind === "node" ? design.nodes.find(n => n.id === target)!.label : target} taken offline`, design); }
  }
  pump(s, design); return s;
}
export function randomLabFailure(state: LabState, design: Design): LabState {
  const s = structuredClone(state), candidates = design.nodes.filter(n => componentBehavior(n.type) !== "Client" && !s.nodes[n.id].down);
  if (!candidates.length) return s;
  return toggleLabFailure(s, design, candidates[Math.floor(random(s) * candidates.length)].id, "node");
}
export function labMetrics(s: LabState) {
  const samples = [...s.latencies].sort((a, b) => a - b);
  const percentile = (p: number) => samples.length ? samples[Math.max(0, Math.ceil(samples.length * p) - 1)] : 0;
  const finished = s.succeeded + s.failed;
  return { offered: s.offered, succeeded: s.succeeded, failed: s.failed, pending: s.requests.filter(r => r.status === "pending").length, successRate: finished ? s.succeeded / finished * 100 : 0, throughput: s.time ? s.succeeded / (s.time / 1000) : 0, p50: percentile(.5), p95: percentile(.95), p99: percentile(.99), queued: Object.values(s.nodes).reduce((total, n) => total + n.messages.length, 0), retries: s.retries, deadLetters: s.deadLetters, backgroundCompleted: s.backgroundCompleted, backgroundFailed: s.backgroundFailed };
}
