export const componentCatalog = [
  {"type":"Client","category":"Clients","behavior":"Client","keywords":"user desktop"},
  {"type":"Browser","category":"Clients","behavior":"Client","keywords":"web frontend"},
  {"type":"Mobile app","category":"Clients","behavior":"Client","keywords":"ios android"},
  {"type":"DNS","category":"Networking & security","behavior":"API server","keywords":"domain resolution"},
  {"type":"CDN","category":"Networking & security","behavior":"CDN","keywords":"edge cloudfront cloudflare"},
  {"type":"Load balancer","category":"Networking & security","behavior":"Load balancer","keywords":"alb nginx haproxy"},
  {"type":"API gateway","category":"Networking & security","behavior":"API server","keywords":"kong apigee routing"},
  {"type":"Reverse proxy","category":"Networking & security","behavior":"API server","keywords":"nginx envoy"},
  {"type":"Firewall","category":"Networking & security","behavior":"API server","keywords":"network security"},
  {"type":"WAF","category":"Networking & security","behavior":"API server","keywords":"web application firewall"},
  {"type":"Rate limiter","category":"Networking & security","behavior":"API server","keywords":"throttle quota"},
  {"type":"Auth service","category":"Networking & security","behavior":"API server","keywords":"oauth jwt identity"},
  {"type":"Service discovery","category":"Networking & security","behavior":"API server","keywords":"consul registry"},
  {"type":"API server","category":"Compute","behavior":"API server","keywords":"backend rest graphql"},
  {"type":"Microservice","category":"Compute","behavior":"API server","keywords":"service backend"},
  {"type":"Serverless function","category":"Compute","behavior":"API server","keywords":"lambda cloud function"},
  {"type":"Container","category":"Compute","behavior":"API server","keywords":"docker kubernetes pod"},
  {"type":"WebSocket server","category":"Compute","behavior":"API server","keywords":"realtime socket"},
  {"type":"Worker","category":"Compute","behavior":"Worker","keywords":"background consumer"},
  {"type":"Scheduler","category":"Compute","behavior":"API server","keywords":"cron scheduled jobs"},
  {"type":"Cache","category":"Data & storage","behavior":"Cache","keywords":"redis memcached"},
  {"type":"Database","category":"Data & storage","behavior":"Database","keywords":"db storage"},
  {"type":"SQL database","category":"Data & storage","behavior":"Database","keywords":"postgresql mysql relational"},
  {"type":"NoSQL database","category":"Data & storage","behavior":"Database","keywords":"mongodb dynamodb cassandra"},
  {"type":"Read replica","category":"Data & storage","behavior":"Database","keywords":"replica secondary"},
  {"type":"Search index","category":"Data & storage","behavior":"Database","keywords":"elasticsearch opensearch solr"},
  {"type":"Data warehouse","category":"Data & storage","behavior":"Database","keywords":"snowflake bigquery redshift"},
  {"type":"Object storage","category":"Data & storage","behavior":"Object storage","keywords":"s3 blob bucket"},
  {"type":"File storage","category":"Data & storage","behavior":"Object storage","keywords":"nfs efs file system"},
  {"type":"Block storage","category":"Data & storage","behavior":"Object storage","keywords":"ebs disk volume"},
  {"type":"Queue","category":"Messaging","behavior":"Queue","keywords":"sqs rabbitmq fifo"},
  {"type":"Event bus","category":"Messaging","behavior":"Event bus","keywords":"pubsub eventbridge"},
  {"type":"Message broker","category":"Messaging","behavior":"Queue","keywords":"kafka rabbitmq broker"},
  {"type":"Stream processor","category":"Messaging","behavior":"Worker","keywords":"flink spark streaming"},
  {"type":"Dead letter queue","category":"Messaging","behavior":"Queue","keywords":"dlq failed messages"},
  {"type":"Logging","category":"Operations","behavior":"API server","keywords":"logs elk loki"},
  {"type":"Metrics","category":"Operations","behavior":"API server","keywords":"prometheus grafana monitoring"},
  {"type":"Tracing","category":"Operations","behavior":"API server","keywords":"opentelemetry jaeger"},
  {"type":"Notification service","category":"Operations","behavior":"API server","keywords":"push alerts"},
  {"type":"Email service","category":"Operations","behavior":"API server","keywords":"smtp ses sendgrid"},
  {"type":"Secrets manager","category":"Operations","behavior":"API server","keywords":"vault credentials keys"},
] as const;
export type ComponentType = typeof componentCatalog[number]["type"];
export type CoreComponentType = typeof componentCatalog[number]["behavior"];
export const componentTypes = componentCatalog.map(component => component.type);
const behaviors = Object.fromEntries(componentCatalog.map(c => [c.type, c.behavior])) as Record<ComponentType, CoreComponentType>;
export function componentBehavior(type: ComponentType): CoreComponentType { return behaviors[type]; }
export type NodeSimulationRules = { latencyMs?: number; jitterMs?: number; concurrency?: number; capacity?: number; ttlMs?: number; retryLimit?: number; failureRate?: number; routing?: "round-robin" | "least-connections" };
export type EdgeSimulationRules = { mode?: "auto" | "call" | "async" | "cache-miss" | "cache-hit" | "fallback" | "ignore"; latencyMs?: number; failureRate?: number };
export type DesignNode = { id: string; type: ComponentType; label: string; x: number; y: number; service?: string; groupId?: string; simulation?: NodeSimulationRules };
export const flowKinds = ["request", "response", "event", "media", "replication", "failure"] as const;
export type FlowKind = typeof flowKinds[number];
export const connectionSides = ["top", "right", "bottom", "left"] as const;
export type ConnectionSide = typeof connectionSides[number];
export type DesignEdge = { id: string; from: string; to: string; fromPort?: ConnectionSide; toPort?: ConnectionSide; label?: string; kind?: FlowKind; simulation?: EdgeSimulationRules };
export function connectionAnchor(node: DesignNode, side: ConnectionSide, outside = false): [number, number] {
  if (side === "left") return [node.x + (outside ? 12 : 48), node.y + 27];
  if (side === "right") return [node.x + (outside ? 148 : 112), node.y + 27];
  if (side === "top") return [node.x + 80, node.y + (outside ? -14 : 0)];
  return [node.x + 80, node.y + (outside ? 104 : 90)];
}
export type DesignGroup = { id: string; label: string; kind: "region" | "layer" | "external"; x: number; y: number; width: number; height: number };
// Coordinates retain the original 160 × 90 layout slots for saved designs.
// Rendering and routing use the smaller icon-and-label footprint inside them.
export function nodeBounds(n: DesignNode) { return { x: n.x + 26, y: n.y, width: 108, height: 90 }; }
export function isOverviewConnection(from: DesignNode, to: DesignNode) { return Math.abs(to.x - from.x) + Math.abs(to.y - from.y) <= 400; }
export function connectionPath(from: DesignNode, to: DesignNode, obstacles: DesignNode[] = []) {
  const p = connectionPoints(from, to, obstacles);
  return `M ${p.map(point => point.join(" ")).join(" L ")}`;
}
export function connectionPoints(from: DesignNode, to: DesignNode, obstacles: DesignNode[] = [], ports: { from?: ConnectionSide; to?: ConnectionSide } = {}): [number, number][] {
  type Point = [number, number];
  const maxX = Math.max(995, ...obstacles.map(n => n.x + 160)), maxY = Math.max(595, ...obstacles.map(n => n.y + 120));
  const blocked = (a: Point, b: Point, skip: string[] = []) => obstacles.some(n => {
    if (skip.includes(n.id)) return false;
    const bounds = nodeBounds(n);
    const left = bounds.x - 5, right = bounds.x + bounds.width + 5, top = bounds.y - 5, bottom = bounds.y + bounds.height + 5;
    return a[0] === b[0] ? a[0] > left && a[0] < right && Math.max(a[1], b[1]) > top && Math.min(a[1], b[1]) < bottom : a[1] > top && a[1] < bottom && Math.max(a[0], b[0]) > left && Math.min(a[0], b[0]) < right;
  });
  if (obstacles.length) {
    const laneY = to.x >= from.x ? 6 : -6, laneX = to.y >= from.y ? 6 : -6;
    const anchors = (n: DesignNode, port?: ConnectionSide): Point[][] => port ? [[connectionAnchor(n, port), connectionAnchor(n, port, true)]] : [ [[n.x + 112, n.y + 27 + laneY], [n.x + 148, n.y + 27 + laneY]], [[n.x + 48, n.y + 27 + laneY], [n.x + 12, n.y + 27 + laneY]], [[n.x + 80 + laneX, n.y + 90], [n.x + 80 + laneX, n.y + 104]], [[n.x + 80 + laneX, n.y], [n.x + 80 + laneX, n.y - 14]] ];
    let best: Point[] | undefined, bestScore = Infinity;
    for (const [a, start] of anchors(from, ports.from)) for (const [b, end] of anchors(to, ports.to)) {
      if (blocked(a, start, [from.id]) || blocked(end, b, [to.id])) continue;
      const axis = a[0] === b[0] ? 1 : a[1] === b[1] ? 0 : undefined;
      if (axis !== undefined && Math.sign(b[axis] - a[axis]) === Math.sign(start[axis] - a[axis]) && Math.sign(a[axis] - b[axis]) === Math.sign(end[axis] - b[axis]) && !blocked(a, b, [from.id, to.id])) {
        const score = Math.abs(b[axis] - a[axis]) + 16;
        if (score < bestScore) { best = [a, b]; bestScore = score; }
      }
      const candidates: Point[][] = [[start, [end[0], start[1]], end], [start, [start[0], end[1]], end]];
      const railsX = new Set([(start[0] + end[0]) / 2, ...obstacles.flatMap(n => [n.x + 12, n.x + 148])]);
      const railsY = new Set([(start[1] + end[1]) / 2, ...obstacles.flatMap(n => [n.y - 14, n.y + 104])]);
      for (const x of railsX) candidates.push([start, [x, start[1]], [x, end[1]], end]);
      for (const y of railsY) candidates.push([start, [start[0], y], [end[0], y], end]);
      for (const middle of candidates) {
        const points = [a, ...middle, b].filter((p, i, all) => i === 0 || p[0] !== all[i - 1][0] || p[1] !== all[i - 1][1]);
        if (points.some(p => p[0] < 5 || p[0] > maxX || p[1] < 5 || p[1] > maxY)) continue;
        const score = points.slice(1).reduce((sum, p, i) => sum + Math.abs(p[0] - points[i][0]) + Math.abs(p[1] - points[i][1]), 0) + points.length * 8;
        if (score >= bestScore || middle.slice(1).some((p, i) => blocked(middle[i], p))) continue;
        best = points; bestScore = score;
      }
    }
    if (best) return best;
  }
  const dx = to.x - from.x, dy = to.y - from.y;
  if (ports.from || ports.to) {
    const sourceSide = ports.from || (Math.abs(dx) >= Math.abs(dy) ? dx >= 0 ? "right" : "left" : dy >= 0 ? "bottom" : "top");
    const targetSide = ports.to || (Math.abs(dx) >= Math.abs(dy) ? dx >= 0 ? "left" : "right" : dy >= 0 ? "top" : "bottom");
    const a = connectionAnchor(from, sourceSide), start = connectionAnchor(from, sourceSide, true), end = connectionAnchor(to, targetSide, true), b = connectionAnchor(to, targetSide);
    return [a, start, [end[0], start[1]], end, b];
  }
  if (Math.abs(dx) >= Math.abs(dy)) {
    const a: [number, number] = [from.x + (dx >= 0 ? 112 : 48), from.y + 27];
    const b: [number, number] = [to.x + (dx >= 0 ? 48 : 112), to.y + 27];
    const middle = (a[0] + b[0]) / 2;
    return [a, [middle, a[1]], [middle, b[1]], b];
  }
  const a: [number, number] = [from.x + 80, from.y + (dy >= 0 ? 90 : 0)];
  const b: [number, number] = [to.x + 80, to.y + (dy >= 0 ? 0 : 90)];
  const middle = (a[1] + b[1]) / 2;
  return [a, [a[0], middle], [b[0], middle], b];
}
export function connectionLabelPosition(from: DesignNode, to: DesignNode, obstacles: DesignNode[] = []) {
  return routeLabelPosition(connectionPoints(from, to, obstacles), obstacles);
}
export function routeLabelPosition(points: [number, number][], nodes: DesignNode[] = []) {
  let index = 0, length = 0;
  for (let i = 0; i < points.length - 1; i++) { const distance = Math.abs(points[i][0] - points[i + 1][0]) + Math.abs(points[i][1] - points[i + 1][1]); if (distance > length) { length = distance; index = i; } }
  const horizontal = points[index][1] === points[index + 1][1];
  const reverse = points[index + 1][0] < points[index][0];
  const x = (points[index][0] + points[index + 1][0]) / 2, y = (points[index][1] + points[index + 1][1]) / 2 + (horizontal && length < 50 ? -60 : horizontal && reverse ? 13 : horizontal ? -8 : 0);
  const maxWidth = horizontal && length >= 50 ? Math.min(174, length - 8) : 150;
  const positions = horizontal ? [{ x, y }, { x, y: y - 32 }, { x, y: y + 32 }, { x, y: y - 60 }] : [{ x, y }, { x: x + 85, y }, { x: x - 85, y }];
  const frameWidth = Math.max(1000, ...nodes.map(n => n.x + 160)), frameHeight = Math.max(600, ...nodes.map(n => n.y + 120));
  const clear = positions.find(p => p.x - maxWidth / 2 >= 0 && p.x + maxWidth / 2 <= frameWidth && p.y >= 20 && p.y <= frameHeight - 20 && !nodes.some(n => { const b = nodeBounds(n); return p.x + maxWidth / 2 > b.x && p.x - maxWidth / 2 < b.x + b.width && p.y + 20 > b.y && p.y - 25 < b.y + b.height; }));
  return { ...(clear || { x, y }), maxWidth };
}
export type Design = { version: 1; title: string; nodes: DesignNode[]; edges: DesignEdge[]; groups?: DesignGroup[]; canvas?: { width: number; height: number } };
export function designRoutes(design: Design) {
  return design.edges.map(edge => {
    const from = design.nodes.find(n => n.id === edge.from)!, to = design.nodes.find(n => n.id === edge.to)!;
    const points = connectionPoints(from, to, design.nodes);
    return { edge, from, to, path: `M ${points.map(p => p.join(" ")).join(" L ")}`, position: routeLabelPosition(points, design.nodes) };
  });
}
export type Lesson = { title: string; subtitle: string; concepts: string[]; flow: ComponentType[]; steps: string[]; tradeoff: string; question: string; options: string[]; answer: number; explanation: string; assignment: string };
export const lessons: Lesson[] = [
  { title: "The journey of a request", subtitle: "Follow one click, from browser to persistent data.", concepts: ["HTTP", "Request / response", "Latency"], flow: ["Client", "API server", "Database"], steps: ["The browser sends an HTTP request to fetch a course. Network travel contributes to latency.", "The API validates the request, checks permissions, and decides which data to read.", "The database finds the course. The API serializes the result and returns a response to the browser."], tradeoff: "A simple architecture is easy to operate, but a single API server can become a bottleneck or a single point of failure.", question: "Which component persists course records?", options: ["Client", "Database", "Load balancer"], answer: 1, explanation: "The database stores durable records; an API server processes requests and a client displays responses.", assignment: "Build a Client → API server → Database flow. Explain where you would check that a student owns a paid course." },
  { title: "Load balancing & scale", subtitle: "Distribute requests instead of overwhelming one server.", concepts: ["Horizontal scaling", "Health checks", "Stateless services"], flow: ["Client", "Load balancer", "API server", "Database"], steps: ["A client sends a request to the public address of a load balancer.", "The balancer checks available healthy servers and chooses one using a routing policy.", "A stateless API instance processes the request. Other requests can use other instances.", "Instances share a data tier. Scaling API servers alone does not remove database bottlenecks."], tradeoff: "More instances improve capacity and resilience, but introduce operating costs. Session data must be shared or carried in a verifiable token.", question: "What should a load balancer do with an unhealthy instance?", options: ["Send it all traffic", "Store its sessions", "Stop routing requests to it"], answer: 2, explanation: "Health checks allow the balancer to exclude unhealthy instances while healthy ones continue serving requests.", assignment: "Place a load balancer before two API servers and connect both to a database. Identify the remaining single point of failure." },
  { title: "Caching hot data", subtitle: "Understand a cache miss, a hit, and stale results.", concepts: ["Cache-aside", "TTL", "Invalidation"], flow: ["Client", "API server", "Cache", "Database"], steps: ["A student requests a popular course page.", "The API first checks the cache for the course key.", "On a hit, cached data is returned immediately. On a miss, the API reads the database.", "The API stores the database result in the cache with a time-to-live. Future requests may hit it."], tradeoff: "A cache reduces repeated reads, but values may become stale. Invalidate or update entries after writes; protect the database from simultaneous cache misses.", question: "After changing a course price, what prevents serving its old cached price?", options: ["Invalidate or update the cache entry", "Increase its TTL forever", "Add more clients"], answer: 0, explanation: "Updating or invalidating the affected key makes subsequent reads reflect the change. TTL alone permits a stale window.", assignment: "Connect an API to both a cache and database. Describe the hit and miss paths, and an invalidation strategy for edited courses." },
  { title: "Queues & background jobs", subtitle: "Keep slow work out of the response path.", concepts: ["Asynchronous jobs", "Retries", "Idempotency"], flow: ["API server", "Queue", "Worker", "Object storage"], steps: ["An instructor submits a video. The API accepts the job and returns a job identifier.", "A durable queue holds the job until a worker can process it.", "A worker transcodes the video. Failed work can be retried with a bounded retry policy.", "The output is stored and job status is updated. Idempotent processing prevents duplicate effects on redelivery."], tradeoff: "Queues absorb bursts, but results are delayed. Use retries, dead-letter handling, and idempotency because delivery can happen more than once.", question: "Why should a worker be idempotent?", options: ["To eliminate storage", "To safely handle repeated delivery", "To make every task synchronous"], answer: 1, explanation: "Processing the same job again should not charge twice, send duplicate notifications, or create duplicate records.", assignment: "Design a video processing pipeline with a queue, worker, and object storage. Explain retry limits and how you prevent duplicate outputs." },
  { title: "Replication & consistency", subtitle: "See why a recent write may not appear on a replica.", concepts: ["Primary / replica", "Replication lag", "Read-your-writes"], flow: ["Client", "API server", "Database", "Database"], steps: ["The student updates a profile through the API.", "The API writes to the primary database and receives an acknowledgement.", "The primary streams changes to replicas. Asynchronous replicas can lag behind.", "A read from a replica can temporarily return older data. Critical reads may need primary routing or a consistency guarantee."], tradeoff: "Replicas can improve read capacity and availability. Replication is not a backup, and asynchronous replication introduces stale-read and failover risks.", question: "Why can a replica show an old profile immediately after an update?", options: ["Replication lag", "Too many CSS files", "A load balancer always deletes writes"], answer: 0, explanation: "An asynchronous replica may not yet have applied the latest primary write.", assignment: "Label two databases Primary and Replica. Draw writes to the primary and reads to the replica, and explain when to read from the primary." },
  { title: "Partitioning your data", subtitle: "Spread a growing dataset across independent shards.", concepts: ["Partition keys", "Hot shards", "Cross-shard queries"], flow: ["Client", "API server", "Database", "Database"], steps: ["The client requests records for a student account.", "The API computes the shard using a partition key such as student ID.", "The owning shard answers the request. Other shards hold different subsets of data.", "Queries across students may fan out to multiple shards. Rebalancing requires a migration strategy."], tradeoff: "Sharding expands capacity, but makes joins, transactions, and rebalancing harder. A popular partition key can create a hot shard.", question: "What makes a good partition key?", options: ["One constant value", "A key that distributes workload evenly", "Always the current date"], answer: 1, explanation: "A useful key spreads data and request load while keeping common queries within a shard.", assignment: "Design two course-progress shards. Choose a partition key and explain how you would handle an unusually active student or institution." },
  { title: "CDNs & media delivery", subtitle: "Serve course videos closer to students.", concepts: ["Edge caching", "Origin", "Signed access"], flow: ["Client", "CDN", "Object storage"], steps: ["A student requests a video segment from a CDN edge location.", "The edge returns a cached segment on a hit. On a miss it fetches from the origin.", "Object storage serves the origin asset. The CDN caches eligible responses for subsequent viewers."], tradeoff: "Edge delivery lowers origin traffic and distance. Paid media needs access control, appropriate cache keys, and expiring signed URLs or cookies.", question: "On a CDN cache miss, where does the CDN fetch the media?", options: ["A random student", "The queue", "The origin"], answer: 2, explanation: "The origin, often object storage, supplies content that is not already cached at the edge.", assignment: "Build Client → CDN → Object storage. Explain how a paid course can use signed access without exposing unrestricted media URLs." },
  { title: "Design a course platform", subtitle: "Combine the building blocks and defend your choices.", concepts: ["Requirements", "Bottlenecks", "Failure modes"], flow: ["Client", "Load balancer", "API server", "Queue", "Worker", "Object storage"], steps: ["Define requirements: browsing, enrollment, assignments, and video playback. Estimate peak request and storage volume.", "Route requests through a load balancer to API instances.", "Use the data tier for enrollment and progress. Cache public catalog reads, not unchecked authorization decisions.", "Send slow video processing jobs to a queue.", "Workers create media variants and update job status.", "Store media in object storage and deliver it through a CDN with access checks."], tradeoff: "Start with the simplest design that meets requirements. Measure bottlenecks before adding complexity; include monitoring, backups, authorization, and recovery plans.", question: "What should guide your architecture first?", options: ["Using every available component", "Requirements and expected workload", "Making the diagram symmetrical"], answer: 1, explanation: "Architecture choices follow functional requirements, traffic estimates, reliability targets, and constraints.", assignment: "Design the full platform: catalog reads, enrollment writes, video processing, and delivery. Describe three failure modes and how your system responds." },
];
export const initialDesign: Design = { version: 1, title: "My course platform", nodes: [
  { id: "client", type: "Client", label: "Student browser", x: 60, y: 160 },
  { id: "api", type: "API server", label: "Course API", x: 350, y: 160 },
  { id: "db", type: "Database", label: "Course database", x: 640, y: 160 },
], edges: [{ id: "e1", from: "client", to: "api" }, { id: "e2", from: "api", to: "db" }] };
export function parseDesign(value: unknown): Design {
  if (!value || typeof value !== "object") throw new Error("Invalid design file.");
  const d = value as Design;
  if (d.canvas !== undefined && (!d.canvas || !Number.isInteger(d.canvas.width) || !Number.isInteger(d.canvas.height) || d.canvas.width < 1000 || d.canvas.width > 3600 || d.canvas.height < 600 || d.canvas.height > 3600)) throw new Error("Invalid canvas size.");
  const canvasWidth = d.canvas?.width ?? 1000, canvasHeight = d.canvas?.height ?? 600;
  if (d.version !== 1 || typeof d.title !== "string" || d.title.length > 120 || !Array.isArray(d.nodes) || !Array.isArray(d.edges) || d.nodes.length > 80 || d.edges.length > 160) throw new Error("Unsupported design or size. Limit: 80 components and 160 connections.");
  const ids = new Set<string>();
  const groupIds = new Set<string>();
  if (d.groups !== undefined) {
    if (!Array.isArray(d.groups) || d.groups.length > 12) throw new Error("Invalid architecture boundaries.");
    for (const g of d.groups) {
      if (!g || typeof g.id !== "string" || !g.id || g.id.length > 100 || groupIds.has(g.id) || typeof g.label !== "string" || g.label.length > 80 || !["region", "layer", "external"].includes(g.kind) || ![g.x, g.y, g.width, g.height].every(Number.isFinite) || g.x < 0 || g.y < 0 || g.width < 180 || g.height < 110 || g.x + g.width > canvasWidth || g.y + g.height > canvasHeight) throw new Error("Invalid architecture boundary.");
      groupIds.add(g.id);
    }
  }
  for (const n of d.nodes) {
    if (!n || typeof n.id !== "string" || n.id.length > 100 || ids.has(n.id) || !componentTypes.includes(n.type) || typeof n.label !== "string" || n.label.length > 80 || !Number.isFinite(n.x) || !Number.isFinite(n.y) || n.x < 0 || n.x > canvasWidth - 160 || n.y < 0 || n.y > canvasHeight - 90) throw new Error("Invalid component.");
    ids.add(n.id);
    if ((n.service !== undefined && (typeof n.service !== "string" || n.service.length > 60)) || (n.groupId !== undefined && !groupIds.has(n.groupId))) throw new Error("Invalid component metadata.");
    if (n.simulation !== undefined) cleanSimulationRules(n.simulation, false);
  }
  const edgeIds = new Set<string>();
  for (const e of d.edges) {
    if (!e || typeof e.id !== "string" || edgeIds.has(e.id) || !ids.has(e.from) || !ids.has(e.to) || e.from === e.to) throw new Error("Invalid connection.");
    edgeIds.add(e.id);
    if ((e.label !== undefined && (typeof e.label !== "string" || e.label.length > 60)) || (e.kind !== undefined && !flowKinds.includes(e.kind))) throw new Error("Invalid connection metadata.");
    if ((e.fromPort !== undefined && !connectionSides.includes(e.fromPort)) || (e.toPort !== undefined && !connectionSides.includes(e.toPort))) throw new Error("Invalid connection side.");
    if (e.simulation !== undefined) cleanSimulationRules(e.simulation, true);
  }
  return { version: 1, title: d.title, ...(d.canvas ? { canvas: { width: canvasWidth, height: canvasHeight } } : {}), nodes: d.nodes.map(n => ({ id: n.id, type: n.type, label: n.label, x: n.x, y: n.y, ...(n.service !== undefined ? { service: n.service } : {}), ...(n.groupId !== undefined ? { groupId: n.groupId } : {}), ...(n.simulation ? { simulation: cleanSimulationRules(n.simulation, false) as NodeSimulationRules } : {}) })), edges: d.edges.map(e => ({ id: e.id, from: e.from, to: e.to, ...(e.fromPort !== undefined ? { fromPort: e.fromPort } : {}), ...(e.toPort !== undefined ? { toPort: e.toPort } : {}), ...(e.label !== undefined ? { label: e.label } : {}), ...(e.kind !== undefined ? { kind: e.kind } : {}), ...(e.simulation ? { simulation: cleanSimulationRules(e.simulation, true) as EdgeSimulationRules } : {}) })), ...(d.groups ? { groups: d.groups.map(g => ({ id: g.id, label: g.label, kind: g.kind, x: g.x, y: g.y, width: g.width, height: g.height })) } : {}) };
}
function cleanSimulationRules(value: unknown, edge: boolean): NodeSimulationRules | EdgeSimulationRules {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid simulation rules.");
  const input = value as Record<string, unknown>, clean: Record<string, unknown> = {};
  const ranges: Record<string, [number, number, boolean?]> = edge ? { latencyMs: [0, 60000], failureRate: [0, 1] } : { latencyMs: [0, 60000], jitterMs: [0, 60000], concurrency: [1, 1000, true], capacity: [0, 10000, true], ttlMs: [1, 600000], retryLimit: [0, 10, true], failureRate: [0, 1] };
  for (const [key, [min, max, integer]] of Object.entries(ranges)) if (input[key] !== undefined) {
    const number = input[key];
    if (typeof number !== "number" || !Number.isFinite(number) || number < min || number > max || (integer && !Number.isInteger(number))) throw new Error(`Invalid simulation ${key}.`);
    clean[key] = number;
  }
  const name = edge ? "mode" : "routing", options = edge ? ["auto", "call", "async", "cache-miss", "cache-hit", "fallback", "ignore"] : ["round-robin", "least-connections"];
  if (input[name] !== undefined) { if (!options.includes(String(input[name]))) throw new Error(`Invalid simulation ${name}.`); clean[name] = input[name]; }
  return clean;
}
export function encodeDesign(d: Design) { return btoa(Array.from(new TextEncoder().encode(JSON.stringify(d)), b => String.fromCharCode(b)).join("")); }
export function decodeDesign(s: string) { if (s.length > 60000) throw new Error("Share link is too large."); return parseDesign(JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(s), c => c.charCodeAt(0))))); }
