"use client";
import { useCallback, useEffect, useRef, useState, type PointerEvent, type RefObject } from "react";
import type { DesignNode } from "@/lib/system-design";

type Camera = { x: number; y: number; zoom: number };
const MIN_ZOOM = .65;
const MAX_ZOOM = 3.5;
export function useDiagramCamera(svg: RefObject<SVGSVGElement | null>, height = 600, width = 1000) {
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
  const current = useRef(camera), animation = useRef<number>(0), wheelAnimation = useRef<number>(0);
  const wheelTarget = useRef<Camera | null>(null);
  const pan = useRef<{ id: number; x: number; y: number; scale: number; camera: Camera } | null>(null);
  const update = useCallback((next: Camera, smooth = false) => {
    cancelAnimationFrame(animation.current);
    cancelAnimationFrame(wheelAnimation.current); wheelAnimation.current = 0; wheelTarget.current = null;
    if (!smooth || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { current.current = next; setCamera(next); return; }
    const before = current.current, started = performance.now();
    function frame(now: number) {
      const t = Math.min(1, (now - started) / 240), ease = 1 - Math.pow(1 - t, 3);
      const value = { x: before.x + (next.x - before.x) * ease, y: before.y + (next.y - before.y) * ease, zoom: before.zoom + (next.zoom - before.zoom) * ease };
      current.current = value; setCamera(value);
      if (t < 1) animation.current = requestAnimationFrame(frame);
    }
    animation.current = requestAnimationFrame(frame);
  }, []);
  const zoomBy = useCallback((factor: number, anchor = { x: .5, y: .5 }, smooth = true) => {
    const before = current.current, zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, before.zoom * factor));
    update({ zoom, x: before.x + width * anchor.x * (1 / before.zoom - 1 / zoom), y: before.y + height * anchor.y * (1 / before.zoom - 1 / zoom) }, smooth);
  }, [height, width, update]);
  const fit = useCallback(() => update({ x: 0, y: 0, zoom: 1 }, true), [update]);
  function focus(node: DesignNode) { const zoom = 2.25; update({ zoom, x: node.x + 80 - width / (2 * zoom), y: node.y + 45 - height / (2 * zoom) }, true); }
  const frame = useCallback((bounds: { x: number; y: number; width: number; height: number }) => { const zoom = Math.min(MAX_ZOOM, width / (bounds.width + 64), height / (bounds.height + 80)); update({ zoom, x: bounds.x + bounds.width / 2 - width / (2 * zoom), y: bounds.y + bounds.height / 2 - height / (2 * zoom) }, true); }, [width, height, update]);
  function startPan(e: PointerEvent<SVGSVGElement>) {
    if (e.button !== 0 && e.button !== 1) return;
    cancelAnimationFrame(animation.current); cancelAnimationFrame(wheelAnimation.current); wheelAnimation.current = 0; wheelTarget.current = null; e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId);
    pan.current = { id: e.pointerId, x: e.clientX, y: e.clientY, scale: e.currentTarget.getScreenCTM()?.a || 1, camera: current.current };
  }
  function movePan(e: PointerEvent<SVGSVGElement>) {
    const drag = pan.current; if (!drag || drag.id !== e.pointerId) return false;
    update({ ...drag.camera, x: drag.camera.x - (e.clientX - drag.x) / drag.scale, y: drag.camera.y - (e.clientY - drag.y) / drag.scale });
    return true;
  }
  function endPan() { pan.current = null; }
  useEffect(() => {
    const element = svg.current; if (!element) return;
    let lastFrame = 0;
    function wheel(e: WheelEvent) {
      if (!e.ctrlKey && !e.metaKey) return;
      const matrix = element!.getScreenCTM(), rect = element!.getBoundingClientRect(); if (!matrix || !rect.width || !rect.height) return;
      const point = element!.createSVGPoint(); point.x = e.clientX; point.y = e.clientY;
      const world = point.matrixTransform(matrix.inverse()), before = current.current;
      const target = wheelTarget.current || before;
      const unit = e.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : e.deltaMode === WheelEvent.DOM_DELTA_PAGE ? rect.height : 1;
      const delta = Math.max(-100, Math.min(100, e.deltaY * unit));
      const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, target.zoom * Math.exp(-delta * .0012)));
      if (zoom === target.zoom) return;
      e.preventDefault();
      const anchorX = (world.x - before.x) * before.zoom / width;
      const anchorY = (world.y - before.y) * before.zoom / height;
      wheelTarget.current = {
        zoom,
        x: world.x - anchorX * width / zoom,
        y: world.y - anchorY * height / zoom,
      };
      if (wheelAnimation.current) return;
      cancelAnimationFrame(animation.current);
      lastFrame = 0;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      function animate(now: number) {
        const destination = wheelTarget.current;
        if (!destination) { wheelAnimation.current = 0; return; }
        if (reducedMotion) {
          current.current = destination; setCamera(destination); wheelTarget.current = null; wheelAnimation.current = 0; return;
        }
        const elapsed = lastFrame ? Math.min(32, now - lastFrame) : 16;
        lastFrame = now;
        const ease = 1 - Math.exp(-elapsed / 90), from = current.current;
        const next = {
          x: from.x + (destination.x - from.x) * ease,
          y: from.y + (destination.y - from.y) * ease,
          zoom: from.zoom + (destination.zoom - from.zoom) * ease,
        };
        const settled = Math.abs(destination.zoom - next.zoom) < .001 && Math.abs(destination.x - next.x) < .1 && Math.abs(destination.y - next.y) < .1;
        current.current = settled ? destination : next; setCamera(current.current);
        if (settled) { wheelTarget.current = null; wheelAnimation.current = 0; }
        else wheelAnimation.current = requestAnimationFrame(animate);
      }
      wheelAnimation.current = requestAnimationFrame(animate);
    }
    element.addEventListener("wheel", wheel, { passive: false });
    return () => { element.removeEventListener("wheel", wheel); cancelAnimationFrame(animation.current); cancelAnimationFrame(wheelAnimation.current); };
  }, [svg, height, width]);
  return { viewBox: `${camera.x} ${camera.y} ${width / camera.zoom} ${height / camera.zoom}`, zoom: camera.zoom, zoomBy, fit, focus, frame, startPan, movePan, endPan };
}
