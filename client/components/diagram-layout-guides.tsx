import type { LayoutGuide } from "@/lib/diagram-alignment";

export function DiagramLayoutGuides({ guides }: { guides: LayoutGuide[] }) {
  return <g data-editor-only="true" className="sd-layout-guides" pointerEvents="none" aria-hidden="true">
    {guides.map((g, i) => {
      const horizontal = g.gap !== undefined ? g.axis === "x" : g.axis === "y";
      const x1 = horizontal ? g.start : g.at, y1 = horizontal ? g.at : g.start;
      const x2 = horizontal ? g.end : g.at, y2 = horizontal ? g.at : g.end;
      const x = (x1 + x2) / 2, y = (y1 + y2) / 2;
      return <g key={i} className={g.gap === undefined ? "sd-alignment-line" : `sd-gap-line ${g.equal ? "is-equal" : ""}`}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} vectorEffect="non-scaling-stroke" />
        {g.gap !== undefined && <><path d={horizontal ? `M${x1},${y1 - 4}v8 M${x2},${y2 - 4}v8` : `M${x1 - 4},${y1}h8 M${x2 - 4},${y2}h8`} vectorEffect="non-scaling-stroke" /><rect x={x - 20} y={y - 9} width="40" height="18" rx="5" /><text x={x} y={y + 3}>{Math.round(g.gap)}</text></>}
      </g>;
    })}
  </g>;
}
