import type { Design } from "./system-design";

export const pipelineDesign: Design = {
  version: 1, title: "A request becomes data, then background work",
  nodes: [
    { id: "client", type: "Client", label: "Browser", x: 15, y: 185 },
    { id: "lb", type: "Load balancer", label: "Load balancer", x: 190, y: 185 },
    { id: "a", type: "API server", label: "API instance A", x: 375, y: 75 },
    { id: "b", type: "API server", label: "API instance B", x: 375, y: 315 },
    { id: "cache", type: "Cache", label: "Shared cache", x: 610, y: 75 },
    { id: "db", type: "Database", label: "Database", x: 810, y: 185 },
    { id: "queue", type: "Queue", label: "FIFO job queue", x: 610, y: 315 },
    { id: "worker", type: "Worker", label: "One worker", x: 810, y: 395 },
  ],
  edges: [
    { id: "entry", from: "client", to: "lb", kind: "request" },
    ...["a", "b"].flatMap(api => [
      { id: `route-${api}`, from: "lb", to: api, kind: "request" as const },
      { id: `cache-${api}`, from: api, to: "cache", kind: "request" as const },
      { id: `db-${api}`, from: api, to: "db", kind: "request" as const },
      { id: `enqueue-${api}`, from: api, to: "queue", kind: "event" as const },
    ]),
    { id: "consume", from: "queue", to: "worker", kind: "event" },
  ],
};
export type Stage = "arrival" | "entry" | "route" | "lookup" | "check" | "hit" | "miss" | "read" | "fetch" | "result" | "fill" | "stored" | "return" | "response" | "done" | "failed";
export type Request = { id: number; key: string; stage: Stage; elapsed: number; server: "a" | "b"; hit?: boolean };
export type Job = { id: number; server: "a" | "b"; attempt: number };
export type Simulation = {
  time: number; nextId: number; turn: number; healthy: { a: boolean; b: boolean };
  requests: Request[]; cache: Record<string, number>; jobs: Job[];
  delivery: { job: Job; elapsed: number }[];
  worker: { job: Job; phase: "take" | "process" | "ack"; elapsed: number } | null;
  failNext: boolean; hits: number; misses: number; reads: number; completed: number; rejected: number; acknowledged: number; retries: number;
  routed: { a: number; b: number }; log: string[];
};
export const durations: Record<Stage, number> = { arrival: 0, entry: .75, route: .75, lookup: .75, check: .65, hit: .75, miss: .75, read: .75, fetch: 1.2, result: .75, fill: .75, stored: .75, return: .75, response: .75, done: Infinity, failed: Infinity };
export function initialSimulation(): Simulation {
  return { time: 0, nextId: 1, turn: 0, healthy: { a: true, b: true }, requests: [], cache: {}, jobs: [], delivery: [], worker: null, failNext: false, hits: 0, misses: 0, reads: 0, completed: 0, rejected: 0, acknowledged: 0, retries: 0, routed: { a: 0, b: 0 }, log: ["Ready. Cache empty; both API instances healthy; worker idle."] };
}
function record(s: Simulation, text: string) { s.log = [text, ...s.log].slice(0, 8); }
export function sendRequests(state: Simulation, count = 1): Simulation {
  const s = structuredClone(state);
  for (let i = 0; i < count; i++) {
    const id = s.nextId++;
    s.requests.push({ id, key: id % 3 === 0 ? "course:17" : "course:42", stage: "arrival", elapsed: -i * 1.1, server: "a" });
  }
  return s;
}
export function isSimulationBusy(s: Simulation) { return s.requests.some(r => r.stage !== "done" && r.stage !== "failed") || !!s.jobs.length || !!s.delivery.length || !!s.worker; }
export function advanceSimulation(state: Simulation, seconds: number): Simulation {
  const s = structuredClone(state);
  // Small fixed substeps preserve event order even if a browser frame stalls.
  const steps = Math.max(1, Math.ceil(seconds / .05)), dt = seconds / steps;
  for (let tick = 0; tick < steps; tick++) {
    s.time += dt;
    for (const [key, expires] of Object.entries(s.cache)) if (expires <= s.time) { delete s.cache[key]; record(s, `${key} expired. Its next lookup will miss.`); }
    for (const r of s.requests) {
      if (r.stage === "done" || r.stage === "failed") continue;
      r.elapsed += dt;
      if (r.elapsed < durations[r.stage]) continue;
      r.elapsed = 0;
      switch (r.stage) {
        case "arrival": r.stage = "entry"; record(s, `R${r.id}: GET /courses · key ${r.key}`); break;
        case "entry": {
          const healthy = (["a", "b"] as const).filter(id => s.healthy[id]);
          if (!healthy.length) { r.stage = "failed"; s.rejected++; record(s, `R${r.id}: 503 · no healthy API instance.`); break; }
          r.server = healthy[s.turn++ % healthy.length]; s.routed[r.server]++; r.stage = "route";
          record(s, `R${r.id}: round robin chose healthy instance ${r.server.toUpperCase()}.`); break;
        }
        case "route": r.stage = "lookup"; break;
        case "lookup": r.stage = "check"; break;
        case "check":
          r.hit = !!s.cache[r.key] && s.cache[r.key] > s.time;
          if (r.hit) { s.hits++; r.stage = "hit"; record(s, `R${r.id}: HIT ${r.key} · database skipped.`); }
          else { s.misses++; r.stage = "miss"; record(s, `R${r.id}: MISS ${r.key} · API will read the database.`); }
          break;
        case "miss": r.stage = "read"; s.reads++; break;
        case "read": r.stage = "fetch"; break;
        case "fetch": r.stage = "result"; break;
        case "result": r.stage = "fill"; break;
        case "fill": s.cache[r.key] = s.time + 20; r.stage = "stored"; record(s, `R${r.id}: cached ${r.key} with a 20-second TTL.`); break;
        case "stored": case "hit":
          r.stage = "return"; s.delivery.push({ job: { id: r.id, server: r.server, attempt: 1 }, elapsed: 0 });
          record(s, `J${r.id}: API sends an independent view-audit job.`); break;
        case "return": r.stage = "response"; break;
        case "response": r.stage = "done"; s.completed++; record(s, `R${r.id}: 200 OK · response finished; background work can continue.`); break;
      }
    }
    s.delivery = s.delivery.filter(d => {
      d.elapsed += dt;
      if (d.elapsed < .75) return true;
      s.jobs.push(d.job); record(s, `J${d.job.id}: enqueued at the tail · ${s.jobs.length} waiting.`); return false;
    });
    if (s.worker) {
      const w = s.worker; w.elapsed += dt;
      const duration = w.phase === "process" ? 2.4 : .75;
      if (w.elapsed >= duration) {
        w.elapsed = 0;
        if (w.phase === "take") { w.phase = "process"; record(s, `J${w.job.id}: worker processing · other jobs wait.`); }
        else if (w.phase === "process") {
          if (s.failNext) { s.failNext = false; s.retries++; s.jobs.push({ ...w.job, attempt: w.job.attempt + 1 }); record(s, `J${w.job.id}: failed · retry at queue tail; no acknowledgement.`); s.worker = null; }
          else w.phase = "ack";
        } else { s.acknowledged++; record(s, `J${w.job.id}: ACK · complete; worker released.`); s.worker = null; }
      }
    } else if (s.jobs.length) {
      const job = s.jobs.shift()!; s.worker = { job, phase: "take", elapsed: 0 };
      record(s, `J${job.id}: oldest waiting job claimed by the single worker.`);
    }
  }
  return s;
}
export function requestLeg(r: Request): { edge: string; reverse?: boolean; label: string; color: string } | null {
  const blue = "#2563eb", green = "#059669", amber = "#d97706";
  switch (r.stage) {
    case "entry": return { edge: "entry", label: `R${r.id}`, color: blue };
    case "route": return { edge: `route-${r.server}`, label: `R${r.id}`, color: blue };
    case "lookup": return { edge: `cache-${r.server}`, label: `GET ${r.key}`, color: blue };
    case "hit": return { edge: `cache-${r.server}`, reverse: true, label: "HIT · data", color: green };
    case "miss": return { edge: `cache-${r.server}`, reverse: true, label: "MISS", color: amber };
    case "read": return { edge: `db-${r.server}`, label: "DB read", color: amber };
    case "result": return { edge: `db-${r.server}`, reverse: true, label: "DB result", color: green };
    case "fill": return { edge: `cache-${r.server}`, label: "SET · TTL 20s", color: amber };
    case "stored": return { edge: `cache-${r.server}`, reverse: true, label: "STORED", color: green };
    case "return": return { edge: `route-${r.server}`, reverse: true, label: "200 OK", color: green };
    case "response": return { edge: "entry", reverse: true, label: "200 OK", color: green };
    default: return null;
  }
}
