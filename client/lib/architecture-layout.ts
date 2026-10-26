import { connectionPoints, routeLabelPosition, type Design } from "./system-design";

// Give dense diagrams breathing room without changing their saved coordinates or IDs.
export function architectureScene(design: Design, options: { preserveCoordinates?: boolean } = {}) {
  const dense = !options.preserveCoordinates && !design.canvas && design.nodes.length >= 12, sx = dense ? 1.25 : 1, sy = dense ? 1.5 : 1;
  const nodes = design.nodes.map(n => ({ ...n, x: (n.x + 80) * sx - 80, y: n.y * sy + (dense ? 12 : 0) }));
  const groups = design.groups?.map(g => ({ ...g, x: g.x * sx, y: g.y * sy, width: g.width * sx, height: g.height * sy }));
  const width = design.canvas?.width ?? (dense ? 1250 : 1000), height = design.canvas?.height ?? (dense ? 900 : 600);
  const routes = design.edges.map(edge => {
    const from = nodes.find(n => n.id === edge.from)!, to = nodes.find(n => n.id === edge.to)!;
    const points = connectionPoints(from, to, nodes, { from: edge.fromPort, to: edge.toPort });
    return { edge, from, to, points, path: roundedRoute(points), position: routeLabelPosition(points, nodes) };
  });
  return { nodes, groups, routes, width, height, scaleX: sx, scaleY: sy, offsetY: dense ? 12 : 0 };
}

export function roundedRoute(points: [number, number][], radius = 10) {
  let path = `M ${points[0].join(" ")}`;
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i - 1], b = points[i], c = points[i + 1];
    const before = Math.hypot(b[0] - a[0], b[1] - a[1]), after = Math.hypot(c[0] - b[0], c[1] - b[1]);
    const r = Math.min(radius, before / 2, after / 2);
    if (!r) continue;
    const entry = [b[0] + (a[0] - b[0]) * r / before, b[1] + (a[1] - b[1]) * r / before];
    const exit = [b[0] + (c[0] - b[0]) * r / after, b[1] + (c[1] - b[1]) * r / after];
    path += ` L ${entry.join(" ")} Q ${b.join(" ")} ${exit.join(" ")}`;
  }
  return `${path} L ${points[points.length - 1].join(" ")}`;
}
