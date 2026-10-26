import { lessons, type Design, type DesignEdge, type DesignNode, type ComponentType } from "./system-design";

const n = (id: string, type: ComponentType, label: string, x: number, y: number, groupId?: string): DesignNode => ({ id, type, label, x, y, ...(groupId ? { groupId } : {}) });
const e = (id: string, from: string, to: string, label: string, kind: DesignEdge["kind"] = "request"): DesignEdge => ({ id, from, to, label, kind });

export const simpleDesign: Design = {
  version: 1, title: "Untitled architecture",
  groups: [{ id: "dc1", label: "DC1", kind: "region", x: 190, y: 220, width: 790, height: 320 }],
  nodes: [
    n("user", "Client", "Web & mobile", 420, 10),
    n("cdn", "CDN", "CDN", 730, 10),
    n("lb", "Load balancer", "Load balancer", 420, 115),
    n("api", "API server", "Web servers", 300, 260, "dc1"),
    n("queue", "Queue", "Message queue", 650, 260, "dc1"),
    n("db", "Database", "Database", 220, 425, "dc1"),
    n("cache", "Cache", "Cache", 420, 425, "dc1"),
    n("worker", "Worker", "Workers", 620, 425, "dc1"),
    n("storage", "Object storage", "Object storage", 810, 425, "dc1"),
  ],
  edges: [
    e("request", "user", "lb", "HTTPS request"),
    e("static", "user", "cdn", "Static assets", "media"),
    e("route", "lb", "api", "Route request"),
    e("lookup", "api", "cache", "Cache lookup"),
    e("read", "api", "db", "Database read"),
    e("enqueue", "api", "queue", "Background job", "event"),
    e("consume", "queue", "worker", "Process job", "event"),
    e("store", "worker", "storage", "Store result"),
  ],
};

export function lessonArchitecture(chapter: number): Design {
  const lesson = lessons[chapter];
  const nodes = lesson.flow.map((type, i) => n(`lesson-${i}`, type, chapter === 4 && i > 1 ? i === 2 ? "Primary database" : "Read replica" : chapter === 5 && i > 1 ? `Shard ${i - 1}` : type, 35 + i * (lesson.flow.length > 4 ? 160 : 225), 190));
  const edges = nodes.slice(1).map((node, i) => e(`lesson-edge-${i}`, nodes[i].id, node.id, ["Send request", "Forward", "Process", "Store", "Deliver"][i], node.type === "Queue" || nodes[i].type === "Queue" ? "event" : "request"));
  if (chapter === 2) {
    nodes[2].y = 75; nodes[3].y = 340; nodes[3].x = nodes[2].x;
    edges[1].label = "Lookup · cache hit";
    edges[2] = e("lesson-edge-2", nodes[1].id, nodes[3].id, "Cache miss · DB read");
  }
  if (chapter === 4) { edges[2].label = "Async replication"; edges[2].kind = "replication"; }
  if (chapter === 5) { nodes[2].y = 75; nodes[3].x = nodes[2].x; nodes[3].y = 340; edges[1].label = "Partition key → shard 1"; edges[2] = e("lesson-edge-2", nodes[1].id, nodes[3].id, "Partition key → shard 2"); }
  if (chapter === 6) { edges[0].label = "Signed segment request"; edges[1].label = "Miss → origin"; edges[1].kind = "media"; }
  if (chapter === 3) { edges[0].label = "Enqueue job"; edges[1].label = "Consume / acknowledge"; edges[2].label = "Write renditions"; edges[2].kind = "media"; }
  if (chapter === 1) {
    nodes[2].y = 100; nodes[3].y = 190;
    nodes.push(n("api-replica", "API server", "API instance B", nodes[2].x, 340));
    edges[1].label = "Healthy instance A";
    edges.push(e("lb-second", nodes[1].id, "api-replica", "Healthy instance B"), e("lb-data", "api-replica", nodes[3].id, "Shared data tier"));
  }
  if (chapter === 2) edges.push(e("cache-hit", nodes[2].id, nodes[1].id, "Cached result", "response"), e("database-result", nodes[3].id, nodes[1].id, "DB result → cache fill", "response"));
  if (chapter === 4) edges.push(e("replica-read", nodes[1].id, nodes[3].id, "Replica read · may lag"));
  if (chapter === 7) {
    nodes.forEach((node, i) => { node.x = [35, 340, 645, 645, 340, 35][i]; node.y = i < 3 ? 75 : 390; });
    nodes.push(n("catalog-cache", "Cache", "Public catalog cache", 340, 230), n("course-data", "Database", "Enrollment & progress", 645, 230), n("media-edge", "CDN", "Signed media delivery", 35, 230));
    edges[1].label = "Route healthy API"; edges[2].label = "Enqueue video job"; edges[3].label = "Consume / acknowledge"; edges[4].label = "Write renditions"; edges[4].kind = "media";
    edges.push(e("catalog", nodes[2].id, "catalog-cache", "Catalog lookup"), e("enrollment", nodes[2].id, "course-data", "Authorized read / write"), e("origin", "media-edge", nodes[5].id, "Origin fetch on miss", "media"), e("playback", nodes[0].id, "media-edge", "Signed media request", "media"));
  }
  nodes.forEach(node => { node.groupId = "application"; });
  return { version: 1, title: lesson.title, nodes, edges, groups: [{ id: "application", label: chapter === 6 ? "Media delivery" : "Application architecture", kind: "layer", x: 15, y: 45, width: 970, height: 440 }] };
}
