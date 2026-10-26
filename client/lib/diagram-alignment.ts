import type { DesignNode } from "./system-design";

export type LayoutGuide = { axis: "x" | "y"; at: number; start: number; end: number; gap?: number; equal?: boolean };
export type LayoutPlacement = { x: number; y: number; guides: LayoutGuide[] };

/** Measurements use the component footprint, in canvas units (independent of zoom). */
export function alignComponent(moving: Pick<DesignNode, "id" | "x" | "y">, nodes: DesignNode[], width: number, height: number, tolerance = 6, enabled = true): LayoutPlacement {
  const result: LayoutPlacement = { x: Math.max(0, Math.min(width - 160, moving.x)), y: Math.max(0, Math.min(height - 90, moving.y)), guides: [] };
  if (!enabled) return result;
  const others = nodes.filter(n => n.id !== moving.id);
  for (const axis of ["x", "y"] as const) {
    const cross = axis === "x" ? "y" : "x";
    const size = axis === "x" ? 108 : 90, offset = axis === "x" ? 26 : 0;
    const crossSize = axis === "x" ? 90 : 108, crossOffset = axis === "x" ? 0 : 26;
    const limit = axis === "x" ? width - 160 : height - 90;
    let best = tolerance + .001;
    let match: { value: number; guides: LayoutGuide[] } | undefined;
    // Compare centers first so ties prefer clean rows/columns over offset edges.
    for (const anchor of [size / 2, 0, size]) for (const n of others) for (const target of [size / 2, 0, size]) {
      const value = n[axis] + target - anchor;
      const delta = Math.abs(value - result[axis]);
      if (value < 0 || value > limit || delta >= best) continue;
      best = delta;
      match = { value, guides: [{ axis, at: value + offset + anchor, start: Math.min(result[cross], n[cross]) + crossOffset - 12, end: Math.max(result[cross], n[cross]) + crossOffset + crossSize + 12 }] };
    }
    const row = others.filter(n => Math.abs(n[cross] - result[cross]) <= tolerance).sort((a, b) => a[axis] - b[axis]);
    // A pair establishes a rhythm: repeat its gap on either side, or split it evenly.
    for (let i = 0; i < row.length - 1; i++) {
      const a = row[i], b = row[i + 1];
      if (Math.abs(a[cross] - b[cross]) > tolerance) continue;
      const gap = b[axis] - a[axis] - size;
      const candidates = [a[axis] - size - gap, b[axis] + size + gap, (a[axis] + b[axis]) / 2];
      for (const value of candidates) {
        const delta = Math.abs(value - result[axis]);
        if (value < 0 || value > limit || delta > tolerance || delta >= best) continue;
        const ordered = [a[axis], b[axis], value].sort((p, q) => p - q);
        const space = ordered[1] - ordered[0] - size;
        if (space < 8 || Math.abs(ordered[2] - ordered[1] - size - space) > .01) continue;
        // Do not snap through another component in this row.
        if (row.some(n => n !== a && n !== b && Math.abs(n[axis] - value) < size + 8)) continue;
        best = delta;
        match = { value, guides: ordered.slice(0, 2).map((start, j) => ({ axis, at: result[cross] + crossOffset + crossSize + 14, start: start + offset + size, end: ordered[j + 1] + offset, gap: space, equal: true })) };
      }
    }
    if (match) { result[axis] = match.value; result.guides.push(...match.guides); }
  }
  // Show the nearest clear gap on each side of the dragged component.
  for (const axis of ["x", "y"] as const) {
    if (result.guides.some(g => g.axis === axis && g.equal)) continue;
    const cross = axis === "x" ? "y" : "x", size = axis === "x" ? 108 : 90, offset = axis === "x" ? 26 : 0;
    const row = others.filter(n => Math.abs(n[cross] - result[cross]) <= tolerance);
    for (const direction of [-1, 1]) {
      const n = row.filter(n => direction * (n[axis] - result[axis]) >= size + 1).sort((a, b) => Math.abs(a[axis] - result[axis]) - Math.abs(b[axis] - result[axis]))[0];
      if (!n) continue;
      const start = Math.min(n[axis], result[axis]) + offset + size, end = Math.max(n[axis], result[axis]) + offset;
      result.guides.push({ axis, at: result[cross] + (axis === "x" ? 104 : 148), start, end, gap: end - start });
    }
  }
  return result;
}
