import type { DesignGroup, DesignNode } from "./system-design";

const zones: Record<string, { label: string; ids: string[] }[]> = {
  hotstar: [
    { label: "Viewers & broadcast", ids: ["viewer", "feed"] },
    { label: "Admission & event access", ids: ["gateway", "session", "config", "rights"] },
    { label: "Live media production", ids: ["ingest", "encoder", "packager"] },
    { label: "Event control & observability", ids: ["telemetry", "monitor", "control"] },
    { label: "Media origin & edge delivery", ids: ["shield", "origin", "cdn", "backup"] },
  ],
  netflix: [
    { label: "Viewers & studio", ids: ["viewer", "studio"] },
    { label: "Playback control & rights", ids: ["gateway", "playback", "account", "drm"] },
    { label: "Ingestion & encoding", ids: ["source", "jobs", "encoder"] },
    { label: "Catalog & watch state", ids: ["catalog", "cache", "progress"] },
    { label: "Media delivery & quality", ids: ["origin", "cdn", "telemetry", "analytics"] },
  ],
  youtube: [
    { label: "Creators & viewers", ids: ["creator", "viewer"] },
    { label: "Upload coordination", ids: ["gateway", "upload", "meta"] },
    { label: "Media processing & eligibility", ids: ["raw", "jobs", "transcoder", "moderation"] },
    { label: "Search & recommendations", ids: ["discovery", "index", "features"] },
    { label: "Delivery & engagement", ids: ["origin", "cdn", "events", "pipeline"] },
  ],
  uber: [
    { label: "Apps & payment provider", ids: ["rider", "driver", "provider"] },
    { label: "Trip control & matching", ids: ["gateway", "trip", "dispatch", "tripdb"] },
    { label: "Location & realtime services", ids: ["location", "geo", "realtime", "eta"] },
    { label: "Payments & ledger", ids: ["payment", "ledger"] },
    { label: "Trip events & consumers", ids: ["events", "notifications", "analytics"] },
  ],
};

export function layoutCase(id: string, nodes: DesignNode[]) {
  const definitions = zones[id];
  const geometry = [
    { x: 20, y: 70, width: 190, height: 720 },
    { x: 250, y: 70, width: 470, height: 330 },
    { x: 780, y: 70, width: 600, height: 330 },
    { x: 250, y: 430, width: 470, height: 360 },
    { x: 780, y: 430, width: 600, height: 360 },
  ];
  const groups: DesignGroup[] = definitions.map((z, i) => ({ id: `zone-${i}`, label: z.label, kind: i === 0 ? "external" : i === 2 ? "region" : "layer", ...geometry[i] }));
  const positions = new Map<string, { x: number; y: number; groupId: string }>();
  definitions.forEach((z, i) => z.ids.forEach((nodeId, index) => {
    const g = groups[i], threeAcross = i === 2 && z.ids.length === 3;
    const column = i === 0 ? 0 : threeAcross ? index : index % 2;
    const row = i === 0 ? index : threeAcross ? 0 : Math.floor(index / 2);
    positions.set(nodeId, { x: i === 0 ? 35 : g.x + (i === 2 || i === 4 ? 30 : 35) + column * (threeAcross ? 200 : i === 4 || i === 2 ? 280 : 230), y: g.y + 75 + row * (i === 0 ? 220 : i >= 3 ? 150 : 130), groupId: g.id });
  }));
  return { canvas: { width: 1400, height: 860 }, nodes: nodes.map(n => ({ ...n, ...positions.get(n.id) })), groups };
}
