import { ComponentIcon } from "@/components/system-design-icons";
import { QueueTunnel } from "@/components/system-design-component-visual";
import { componentCatalog, componentBehavior, connectionLabelPosition, type ComponentType, type DesignGroup, type DesignNode, type DesignEdge, type FlowKind } from "@/lib/system-design";

export const flowColors: Record<FlowKind, string> = { request: "#2563eb", response: "#059669", event: "#a855f7", media: "#d97706", replication: "#0891b2", failure: "#e11d48" };
const coreColors = { Client: "#475569", "Load balancer": "#7c3aed", "API server": "#e11d48", Cache: "#0891b2", Database: "#4f46e5", Queue: "#a855f7", Worker: "#ea880b", CDN: "#7c3aed", "Object storage": "#388b31", "Event bus": "#db2777" };
export const serviceColors = Object.fromEntries(componentCatalog.map(c => [c.type, c.category === "Networking & security" && c.behavior === "API server" ? "#7c3aed" : c.category === "Operations" ? "#64748b" : coreColors[c.behavior]])) as Record<ComponentType, string>;

export function ArchitectureBoundary({ group }: { group: DesignGroup }) {
  const region = group.kind === "region", color = group.kind === "external" ? "#84909b" : region ? "#9a87b6" : "#bd955b";
  return <g aria-label={group.label}>
    <rect x={group.x} y={group.y} width={group.width} height={group.height} rx="2" fill="white" fillOpacity=".3" stroke={color} strokeOpacity=".65" strokeWidth="1.5" strokeDasharray={region ? "6 5" : undefined} />
    <rect x={group.x + 10} y={group.y - 10} width={Math.min(group.width - 20, group.label.length * 6.3 + 18)} height="22" fill="white" />
    <text x={group.x + 18} y={group.y + 5} fill={color} fontSize="11" fontWeight="600" fontFamily="Inter, Arial, sans-serif">{group.label}</text>
  </g>;
}

export function ArchitectureNode({ node, active = false, selected = false, status, phase, progress = 0, queueItems, ordinal }: { node: DesignNode; active?: boolean; selected?: boolean; status?: string; phase?: "enqueue" | "waiting" | "dequeue"; progress?: number; queueItems?: string[]; ordinal?: number }) {
  const color = serviceColors[node.type], lines: string[] = [""];
  for (const word of node.label.split(" ")) { const last = lines.length - 1; if ((lines[last] + " " + word).trim().length > 21 && lines[last]) lines.push(word); else lines[last] = (lines[last] + " " + word).trim(); }
  const subtitle = node.service || (active || selected ? status || node.type : undefined);
  return <g>
    <title>{`${node.label} · ${node.service || node.type}${status ? ` · ${status}` : ""}`}</title>
    <rect x="20" y="0" width="120" height="90" rx="12" fill="transparent" />
    {(active || selected) && <rect x="47" y="-2" width="66" height="58" rx="19" fill={`${color}08`} stroke={color} strokeOpacity=".35" strokeWidth="1.5" />}
    {componentBehavior(node.type) === "Queue" ? <g transform="translate(34,-1) scale(.58)"><QueueTunnel color={color} phase={phase} progress={progress} items={queueItems} /></g> : <g>
      <rect x="58" y="4" width="44" height="44" rx="3" fill={color} />
      <g transform="translate(66,12)" color="white"><ComponentIcon type={node.type} size={28} className="sd-service-glyph" /></g>
    </g>}
    {ordinal !== undefined && <g><circle cx="42" cy="7" r="9" fill="#354052"/><text x="42" y="10.5" textAnchor="middle" fill="white" fontSize="9" fontWeight="600">{ordinal}</text></g>}
    {lines.slice(0, 2).map((line, i) => <text key={i} x="80" y={66 + i * 16} textAnchor="middle" fontSize="12.5" fontWeight="500" fill="#253550" stroke="white" strokeWidth="3" paintOrder="stroke" fontFamily="Inter, Arial, sans-serif">{line.length > 24 ? line.slice(0, 23) + "…" : line}</text>)}
    {subtitle && lines.length === 1 && <text x="80" y="84" textAnchor="middle" fontSize="10" fill={active ? color : "#8290a4"} fontFamily="Inter, Arial, sans-serif">{subtitle.slice(0, 30)}</text>}
  </g>;
}

export function ArchitectureEdgeLabel({ edge, from, to, nodes = [], position, active = false }: { edge: DesignEdge; from: DesignNode; to: DesignNode; nodes?: DesignNode[]; position?: { x: number; y: number; maxWidth?: number }; active?: boolean }) {
  if (!edge.label) return null;
  const { x, y, maxWidth = 174 } = position || connectionLabelPosition(from, to, nodes);
  const width = Math.max(32, Math.min(maxWidth, edge.label.length * 6 + 18));
  const limit = Math.max(5, Math.floor((width - 12) / 6)), lines: string[] = [""];
  for (const word of edge.label.split(" ")) { const last = lines.length - 1; if ((lines[last] + " " + word).trim().length > limit && lines[last]) lines.push(word); else lines[last] = (lines[last] + " " + word).trim(); }
  const visible = lines.slice(0, 3), top = y - (visible.length - 1) * 6.5;
  return <g pointerEvents="none"><title>{edge.label}</title><rect x={x - width / 2} y={top - 12} width={width} height={visible.length * 13 + 8} rx="6" fill="white" fillOpacity=".98" />{visible.map((line, i) => <text key={i} x={x} y={top + i * 13 + 1} textAnchor="middle" fill={active ? flowColors[edge.kind || "request"] : "#526477"} fontFamily="Arial, sans-serif" fontSize="10.5">{line.length > limit ? line.slice(0, limit - 1) + "…" : i === 2 && lines.length > 3 ? line + "…" : line}</text>)}</g>;
}
