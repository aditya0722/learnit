"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Share2, Upload, Play, Pause, Trash2, Undo2, Redo2, Plus, MousePointer2, Network, Hand, Minus, Scan, X, PanelsTopLeft, MoreHorizontal, Magnet } from "lucide-react";
import { componentCatalog, connectionAnchor, connectionPoints, connectionSides, isOverviewConnection, parseDesign, encodeDesign, decodeDesign, flowKinds, type ConnectionSide, type Design, type ComponentType, type DesignEdge, type DesignGroup, type DesignNode } from "@/lib/system-design";
import { architectureScene, roundedRoute } from "@/lib/architecture-layout";
import { ComponentIcon } from "@/components/system-design-icons";
import { ArchitectureBoundary, ArchitectureNode, ArchitectureEdgeLabel, flowColors } from "@/components/system-design-architecture";
import { useDiagramCamera } from "@/components/use-diagram-camera";
import ArchitectureSimulationLab from "@/components/architecture-simulation-lab";
import { simpleDesign } from "@/lib/system-design-templates";
import { alignComponent, type LayoutGuide } from "@/lib/diagram-alignment";
import { DiagramLayoutGuides } from "@/components/diagram-layout-guides";

type DragPreview = { node: DesignNode; x: number; y: number; scale: number };
type ConnectionDraft = { from: string; fromPort: ConnectionSide; tip: [number, number]; target: string | null; toPort?: ConnectionSide; error: string | null };
const portPositions: Record<ConnectionSide, [number, number, number]> = { top: [80, -14, -90], right: [130, 27, 0], bottom: [80, 104, 90], left: [30, 27, 180] };

export default function DesignPlayground() {
  const [liveFlow, setLiveFlow] = useState(false);
  const [design, setDesign] = useState<Design>(simpleDesign);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(true);
  const [componentSearch, setComponentSearch] = useState("");
  const [libraryPreview, setLibraryPreview] = useState<DragPreview | null>(null);
  const [canDrop, setCanDrop] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [layoutGuides, setLayoutGuides] = useState<LayoutGuide[]>([]);
  const bypassSnap = useRef(false);
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key === "Alt") { bypassSnap.current = true; setLayoutGuides([]); } };
    const up = (e: KeyboardEvent) => { if (e.key === "Alt") bypassSnap.current = false; };
    const reset = () => { bypassSnap.current = false; };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", reset);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", reset); };
  }, []);
  const libraryDrag = useRef<{ type: ComponentType; startX: number; startY: number; active: boolean } | null>(null);
  const suppressLibraryClick = useRef(false);
  const [speed, setSpeed] = useState(2);
  const [panMode, setPanMode] = useState(false);
  const [allConnections, setAllConnections] = useState(true);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const [sourcePort, setSourcePort] = useState<ConnectionSide | undefined>();
  const [connectionDraft, setConnectionDraft] = useState<ConnectionDraft | null>(null);
  const connectionDrag = useRef<ConnectionDraft | null>(null);
  const [newConnection, setNewConnection] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [exportStatus, setExportStatus] = useState("");
  const exportDialog = useRef<HTMLDialogElement>(null);
  const exportText = useRef<HTMLTextAreaElement>(null);
  const [past, setPast] = useState<Design[]>([]);
  const [future, setFuture] = useState<Design[]>([]);
  const editSession = useRef<Design | null>(null);
  const canvasPointer = useRef<{ x: number; y: number } | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const [overTrash, setOverTrash] = useState(false);
  const [deletedPreview, setDeletedPreview] = useState<(DragPreview & { dx: number; dy: number }) | null>(null);
  const trash = useRef<HTMLDivElement>(null);
  const trashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exportJson = useMemo(() => JSON.stringify(design, null, 2), [design]);
  useEffect(() => {
    const dialog = exportDialog.current;
    if (exportOpen && dialog && !dialog.open) dialog.showModal();
    else if (!exportOpen && dialog?.open) dialog.close();
  }, [exportOpen]);
  const svg = useRef<SVGSVGElement>(null);
  const frameWidth = design.canvas?.width ?? 1000, frameHeight = design.canvas?.height ?? 600;
  const scene = useMemo(() => architectureScene(design, { preserveCoordinates: true }), [design]);
  const libraryGroups = useMemo(() => {
    const search = componentSearch.trim().toLowerCase();
    const groups = new Map<string, typeof componentCatalog[number][]>();
    for (const component of componentCatalog) {
      if (search && !`${component.type} ${component.keywords} ${component.category}`.toLowerCase().includes(search)) continue;
      groups.set(component.category, [...(groups.get(component.category) || []), component]);
    }
    return Array.from(groups);
  }, [componentSearch]);
  const camera = useDiagramCamera(svg, scene.height, scene.width);
  const importer = useRef<HTMLInputElement>(null);
  const drag = useRef<{ id: string; dx: number; dy: number; startX: number; startY: number; before: Design; moved: boolean; overTrash: boolean; preview: DragPreview } | null>(null);
  useEffect(() => () => { if (trashTimer.current) clearTimeout(trashTimer.current); }, []);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (window.matchMedia("(max-width: 760px)").matches) setLibraryOpen(false);
      try {
        const hash = window.location.hash.slice(1);
        if (hash) { setDesign(decodeDesign(hash)); window.history.replaceState(null, "", window.location.pathname + window.location.search); setMessage("Shared design loaded. Edits are saved on this browser."); }
        else { const saved = localStorage.getItem("learnit-system-design-canvas-simple"); if (saved) setDesign(parseDesign(JSON.parse(saved))); }
      } catch (e) { setMessage(e instanceof Error ? e.message : "Unable to restore design."); }
      setReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => { if (!ready) return; try { localStorage.setItem("learnit-system-design-canvas-simple", JSON.stringify(design)); } catch { queueMicrotask(() => setMessage("Local save unavailable. Download JSON to preserve your work.")); } }, [design, ready]);
  function clearSelection() { finishEdit(); setSelected(null); setSelectedEdge(null); setSelectedGroup(null); }
  function hideMobileLibrary() { if (window.matchMedia("(max-width: 760px)").matches) setLibraryOpen(false); }
  function selectNode(id: string) { clearSelection(); setSelected(id); hideMobileLibrary(); }
  function selectEdge(id: string) { clearSelection(); setSelectedEdge(id); hideMobileLibrary(); }
  function selectGroup(id: string) { clearSelection(); setSelectedGroup(id); hideMobileLibrary(); }
  function commit(next: Design) {
    if (!editSession.current) { setPast(p => [...p.slice(-49), design]); setFuture([]); }
    setDesign(next); setShareUrl("");
  }
  function beginEdit() { editSession.current = design; }
  function finishEdit() {
    const before = editSession.current;
    editSession.current = null;
    if (before && JSON.stringify(before) !== JSON.stringify(design)) { setPast(p => [...p.slice(-49), before]); setFuture([]); }
  }
  const undo = useCallback(() => {
    if (!past.length) return;
    setFuture(f => [design, ...f]); setDesign(past[past.length - 1]); setPast(p => p.slice(0, -1));
    setShareUrl(""); setSelected(null); setSelectedEdge(null); setSelectedGroup(null); setSource(null); setNewConnection(null);
  }, [design, past, setFuture, setDesign, setPast, setShareUrl, setSelected, setSelectedEdge, setSelectedGroup, setSource, setNewConnection]);
  const redo = useCallback(() => {
    if (!future.length) return;
    setPast(p => [...p, design]); setDesign(future[0]); setFuture(f => f.slice(1));
    setShareUrl(""); setSelected(null); setSelectedEdge(null); setSelectedGroup(null); setSource(null); setNewConnection(null);
  }, [design, future, setFuture, setDesign, setPast, setShareUrl, setSelected, setSelectedEdge, setSelectedGroup, setSource, setNewConnection]);
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (e.defaultPrevented || target?.closest("dialog,input,textarea,select,[contenteditable=true]")) return;
      const modifier = e.ctrlKey || e.metaKey;
      if (modifier && e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
      else if (modifier && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);
  function add(type: ComponentType, at?: { x: number; y: number }) {
    if (design.nodes.length >= 80) { setMessage("Component limit reached (80)."); return; }
    const id = crypto.randomUUID();
    const point = at || { x: 80 + (design.nodes.length % 4) * 200, y: 50 + (Math.floor(design.nodes.length / 4) % 5) * 100 };
    commit({ ...design, nodes: [...design.nodes, { id, type, label: type, x: Math.max(0, Math.min(frameWidth - 160, point.x)), y: Math.max(0, Math.min(frameHeight - 90, point.y)) }] }); selectNode(id);
    setMessage(`${type} added. Drag to arrange or connect it to another component.`);
  }
  function startLibraryDrag(e: ReactPointerEvent<HTMLButtonElement>, type: ComponentType) {
    if (e.button !== 0) return;
    e.currentTarget.focus(); e.currentTarget.setPointerCapture(e.pointerId);
    suppressLibraryClick.current = false;
    libraryDrag.current = { type, startX: e.clientX, startY: e.clientY, active: false };
  }
  function isCanvasDrop(x: number, y: number) {
    return !!svg.current && document.elementFromPoint(x, y)?.closest("svg.sd-canvas") === svg.current;
  }
  function moveLibraryDrag(e: ReactPointerEvent<HTMLButtonElement>) {
    const current = libraryDrag.current;
    if (!current || !current.active && Math.hypot(e.clientX - current.startX, e.clientY - current.startY) < 6) return;
    current.active = true; suppressLibraryClick.current = true;
    const valid = isCanvasDrop(e.clientX, e.clientY);
    setCanDrop(valid);
    const point = position(e.clientX, e.clientY);
    const placed = placement("preview", point.x - 80, point.y - 26, valid && !e.altKey);
    setLayoutGuides(placed.guides);
    const screen = valid ? screenPosition(placed.x + 80, placed.y + 26) : { x: e.clientX, y: e.clientY };
    setLibraryPreview({ node: { id: "preview", type: current.type, label: current.type, x: 0, y: 0 }, x: screen.x, y: screen.y, scale: svg.current?.getScreenCTM()?.a || 1 });
  }
  function finishLibraryDrag(e?: ReactPointerEvent<HTMLButtonElement>) {
    const current = libraryDrag.current;
    if (current?.active && e && isCanvasDrop(e.clientX, e.clientY)) {
      const point = position(e.clientX, e.clientY);
      add(current.type, placement("preview", point.x - 80, point.y - 26, !e.altKey));
    }
    libraryDrag.current = null; setLibraryPreview(null); setCanDrop(false); setLayoutGuides([]);
  }
  function removeNode() { if (!selected) return; commit({ ...design, nodes: design.nodes.filter(n => n.id !== selected), edges: design.edges.filter(e => e.from !== selected && e.to !== selected) }); clearSelection(); }
  function connectionError(from: string, to: string) {
    if (from === to) return "Choose a different component.";
    if (design.edges.some(e => e.from === from && e.to === to)) return "These components are already connected in this direction.";
    if (design.edges.length >= 160) return "Connection limit reached (160).";
    return null;
  }
  function addConnection(from: string, to: string, fromPort?: ConnectionSide, toPort?: ConnectionSide) {
    const error = connectionError(from, to);
    if (error) { setMessage(error); return; }
    const id = crypto.randomUUID();
    commit({ ...design, edges: [...design.edges, { id, from, to, ...(fromPort ? { fromPort } : {}), ...(toPort ? { toPort } : {}), label: "Request", kind: "request" }] });
    clearSelection(); setSelectedEdge(id); setNewConnection(id);
    setMessage("Connection added. Select the path to rename it or change its flow type.");
  }
  function connect(id: string) {
    if (!source) { setSource(id); setSourcePort(undefined); setMessage("Now select the destination component."); return; }
    addConnection(source, id, sourcePort);
    setSource(null); setSourcePort(undefined);
  }
  function startConnection(e: ReactPointerEvent<SVGGElement>, node: DesignNode, side: ConnectionSide) {
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation(); e.currentTarget.focus();
    if (design.edges.length >= 160) { setMessage("Connection limit reached (160)."); return; }
    clearSelection(); setHoveredEdge(null); setConnecting(false); setPanMode(false); setSource(null);
    const draft: ConnectionDraft = { from: node.id, fromPort: side, tip: connectionAnchor(node, side), target: null, error: null };
    connectionDrag.current = draft; setConnectionDraft(draft);
    svg.current?.setPointerCapture(e.pointerId);
  }
  function moveConnection(e: ReactPointerEvent<SVGSVGElement>) {
    const current = connectionDrag.current;
    if (!current || !svg.current) return;
    const point = svg.current.createSVGPoint(); point.x = e.clientX; point.y = e.clientY;
    const world = point.matrixTransform(svg.current.getScreenCTM()!.inverse());
    const element = document.elementFromPoint(e.clientX, e.clientY);
    const target = scene.nodes.find(n => n.id === element?.closest("[data-design-node]")?.getAttribute("data-design-node"));
    const explicitPort = element?.closest("[data-port]")?.getAttribute("data-port") as ConnectionSide | null;
    const toPort = target ? explicitPort || connectionSides.reduce((best, side) => {
      const a = connectionAnchor(target, side), b = connectionAnchor(target, best);
      return Math.hypot(world.x - a[0], world.y - a[1]) < Math.hypot(world.x - b[0], world.y - b[1]) ? side : best;
    }) : undefined;
    const draft: ConnectionDraft = { ...current, tip: [world.x, world.y], target: target?.id || null, toPort, error: target ? connectionError(current.from, target.id) : null };
    connectionDrag.current = draft; setConnectionDraft(draft);
  }
  function finishConnection(e?: ReactPointerEvent<SVGSVGElement>) {
    if (e) moveConnection(e);
    const draft = connectionDrag.current;
    connectionDrag.current = null; setConnectionDraft(null);
    if (!draft) return;
    if (e && draft.target && !draft.error) addConnection(draft.from, draft.target, draft.fromPort, draft.toPort);
    else setMessage(draft.error || "Connection cancelled. Drag a side arrow onto another component to connect.");
  }
  function updateEdge(patch: Partial<DesignEdge>) { commit({ ...design, edges: design.edges.map(e => e.id === selectedEdge ? { ...e, ...patch } : e) }); }
  function updateGroup(patch: Partial<DesignGroup>) { commit({ ...design, groups: design.groups?.map(g => g.id === selectedGroup ? { ...g, ...patch } : g) }); }
  function newDesign(blank = false) {
    commit(blank ? { version: 1, title: "Untitled architecture", nodes: [], edges: [] } : simpleDesign);
    clearSelection(); setSource(null); setRunning(false); setLiveFlow(false); camera.fit();
    setMessage(blank ? "Blank canvas ready." : "Simple architecture loaded.");
  }
  function addBoundary() {
    if ((design.groups?.length || 0) >= 12) { setMessage("Boundary limit reached (12)."); return; }
    const id = crypto.randomUUID();
    commit({ ...design, groups: [...(design.groups || []), { id, label: "Data center", kind: "region", x: 30, y: 30, width: 430, height: 260 }] }); selectGroup(id);
  }
  function position(clientX: number, clientY: number) { const point = svg.current!.createSVGPoint(); point.x = clientX; point.y = clientY; const world = point.matrixTransform(svg.current!.getScreenCTM()!.inverse()); return { x: (world.x + 80) / scene.scaleX - 80, y: (world.y - scene.offsetY) / scene.scaleY }; }
  function clearTrashTimer() { if (trashTimer.current) clearTimeout(trashTimer.current); trashTimer.current = null; }
  function placement(id: string, x: number, y: number, active: boolean) {
    return alignComponent({ id, x, y }, design.nodes, frameWidth, frameHeight, 6 / (svg.current?.getScreenCTM()?.a || 1), snapEnabled && active && !bypassSnap.current);
  }
  function screenPosition(x: number, y: number) {
    const point = svg.current!.createSVGPoint(); point.x = (x + 80) * scene.scaleX - 80; point.y = y * scene.scaleY + scene.offsetY;
    return point.matrixTransform(svg.current!.getScreenCTM()!);
  }
  function deleteDraggedComponent() {
    const current = drag.current;
    if (!current?.overTrash) return;
    clearTrashTimer();
    const target = trash.current?.getBoundingClientRect();
    setDeletedPreview({ ...current.preview, dx: target ? target.left + target.width / 2 - current.preview.x : 0, dy: target ? target.top + target.height / 2 - current.preview.y : 0 });
    setDesign(d => ({ ...d, nodes: d.nodes.filter(n => n.id !== current.id), edges: d.edges.filter(e => e.from !== current.id && e.to !== current.id) }));
    setPast(p => [...p.slice(-49), current.before]); setFuture([]); setShareUrl("");
    clearSelection(); setSource(null); setMessage(`${current.preview.node.label} deleted with its connections. Undo to restore.`);
    drag.current = null; setDragPreview(null); setOverTrash(false); setLayoutGuides([]);
  }
  function moveComponent(e: ReactPointerEvent<SVGSVGElement>) {
    if (connectionDrag.current) { moveConnection(e); return; }
    if (camera.movePan(e)) return;
    const current = drag.current;
    if (!current || !current.moved && Math.hypot(e.clientX - current.startX, e.clientY - current.startY) < 4) return;
    current.moved = true;
    const bounds = trash.current?.getBoundingClientRect();
    const inside = !!bounds && e.clientX >= bounds.left - 12 && e.clientX <= bounds.right + 12 && e.clientY >= bounds.top - 12 && e.clientY <= bounds.bottom + 12;
    if (inside !== current.overTrash) {
      current.overTrash = inside; setOverTrash(inside); clearTrashTimer();
      if (inside) trashTimer.current = setTimeout(deleteDraggedComponent, 450);
    }
    const p = position(e.clientX, e.clientY);
    const placed = placement(current.id, p.x - current.dx, p.y - current.dy, !inside && !e.altKey && isCanvasDrop(e.clientX, e.clientY));
    setLayoutGuides(placed.guides);
    const screen = inside ? { x: e.clientX, y: e.clientY } : screenPosition(placed.x + 80, placed.y + 45);
    current.preview = { ...current.preview, x: screen.x, y: screen.y };
    setDragPreview(current.preview);
    setDesign(d => ({ ...d, nodes: d.nodes.map(n => n.id === current.id ? { ...n, x: placed.x, y: placed.y } : n) }));
  }
  function finishDrag(cancelled = false) {
    const current = drag.current;
    clearTrashTimer();
    if (!cancelled && current?.overTrash) { deleteDraggedComponent(); return; }
    if (current?.moved) {
      if (cancelled) setDesign(current.before);
      else { setPast(p => [...p.slice(-49), current.before]); setFuture([]); setShareUrl(""); }
    }
    drag.current = null; setDragPreview(null); setOverTrash(false); setLayoutGuides([]);
  }
  function download(content: string, name: string, type: string) { const a = document.createElement("a"); a.href = `data:${type};charset=utf-8,${encodeURIComponent(content)}`; a.download = name; a.hidden = true; document.body.append(a); a.click(); setTimeout(() => a.remove(), 60000); setMessage(`${name} export started.`); }
  function exportSvg() {
    if (!svg.current) return;
    const clone = svg.current.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("viewBox", `0 0 ${scene.width} ${scene.height}`); clone.setAttribute("width", String(scene.width)); clone.setAttribute("height", String(scene.height)); clone.removeAttribute("style"); clone.removeAttribute("class");
    clone.querySelectorAll("animateMotion").forEach(n => n.parentElement?.remove());
    clone.querySelectorAll("[data-editor-only]").forEach(n => n.remove());
    download(new XMLSerializer().serializeToString(clone), "system-design.svg", "image/svg+xml");
  }
  async function share() {
    const url = `${window.location.origin}/system-design/playground#${encodeDesign(design)}`;
    if (url.length > 16000) { setMessage("This design is too large for a reliable share link. Download and share the JSON file."); return; }
    setShareUrl(url); try { await navigator.clipboard.writeText(url); setMessage("Share link copied. Anyone with the link can open this design."); } catch { setMessage("Copy the share link below."); }
  }
  const routes = useMemo(() => {
    const occupied: { x: number; y: number; width: number; height: number }[] = scene.nodes.map(n => ({ x: n.x + 18, y: n.y - 6, width: 124, height: 100 }));
    return scene.routes.map(route => {
      if (!route.edge.label) return route;
      const width = Math.max(32, Math.min(174, route.edge.label.length * 6 + 18));
      const height = Math.min(3, Math.ceil(route.edge.label.length / Math.max(5, Math.floor((width - 12) / 6)))) * 13 + 8;
      const candidates = [0, -28, 28, -56, 56].flatMap(dy => [0, -60, 60, -120, 120].map(dx => ({ x: route.position.x + dx, y: route.position.y + dy })));
      const candidate = candidates.find(p => {
        const box = { x: p.x - width / 2, y: p.y - height / 2, width, height };
        return box.x >= 0 && box.x + width <= scene.width && box.y >= 0 && box.y + height <= scene.height && !occupied.some(r => box.x < r.x + r.width + 6 && box.x + box.width + 6 > r.x && box.y < r.y + r.height + 6 && box.y + box.height + 6 > r.y);
      }) || route.position;
      occupied.push({ x: candidate.x - width / 2, y: candidate.y - height / 2, width, height });
      return { ...route, position: { ...candidate, maxWidth: 174 } };
    });
  }, [scene]);
  const draftPath = (() => {
    if (!connectionDraft) return "";
    const from = scene.nodes.find(n => n.id === connectionDraft.from);
    if (!from) return "";
    const to = scene.nodes.find(n => n.id === connectionDraft.target);
    if (to && !connectionDraft.error) return roundedRoute(connectionPoints(from, to, scene.nodes, { from: connectionDraft.fromPort, to: connectionDraft.toPort }));
    const [x, y] = connectionAnchor(from, connectionDraft.fromPort), [tx, ty] = connectionDraft.tip;
    const distance = Math.max(45, Math.hypot(tx - x, ty - y) * .4);
    const vx = connectionDraft.fromPort === "right" ? 1 : connectionDraft.fromPort === "left" ? -1 : 0;
    const vy = connectionDraft.fromPort === "bottom" ? 1 : connectionDraft.fromPort === "top" ? -1 : 0;
    return `M ${x} ${y} C ${x + vx * distance} ${y + vy * distance} ${tx - vx * distance * .3} ${ty - vy * distance * .3} ${tx} ${ty}`;
  })();
  const newConnectionTarget = design.edges.find(e => e.id === newConnection)?.to;
  const node = design.nodes.find(n => n.id === selected);
  const edge = design.edges.find(e => e.id === selectedEdge);
  const group = design.groups?.find(g => g.id === selectedGroup);
  return <div className={`sd-shell sd-lab-shell sd-workspace ${liveFlow ? "is-testing" : ""}`} onKeyDown={e => { if ((e.target as Element).closest("dialog")) return; if (e.key === "Escape") { if (drag.current) { e.preventDefault(); finishDrag(true); } if (libraryDrag.current) { e.preventDefault(); finishLibraryDrag(); } if (connectionDrag.current) { e.preventDefault(); finishConnection(); } if (source) { e.preventDefault(); setSource(null); setSourcePort(undefined); setConnecting(false); setMessage("Connection cancelled."); } } }}>
    <header className="sd-workspace-header">
      <div className="sd-workspace-brand"><Link href="/" aria-label="Back to Learnit" title="Back to Learnit"><ArrowLeft size={17} /></Link><Network size={19} /><h1>Playground</h1><span className="sd-workspace-divider" /><span className="sd-save-label">Saved on this browser</span></div>
      <div className="sd-data-mode" aria-label="Playground view">
        <button className={`sd-button ${!liveFlow ? "active" : ""}`} aria-pressed={!liveFlow} onClick={() => setLiveFlow(false)}>Design</button>
        <button className={`sd-button ${liveFlow ? "active" : ""}`} aria-pressed={liveFlow} onClick={() => { setLiveFlow(true); setRunning(false); }}><Play size={14} />Run & analyze</button>
      </div>
      <div className="sd-workspace-actions"><details className="sd-file-menu" onClick={e => { if ((e.target as Element).closest("button")) e.currentTarget.open = false; }} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) e.currentTarget.open = false; }}><summary aria-label="Diagram file actions" title="New, import, and export"><MoreHorizontal size={17} /><span>File</span></summary><div><button onClick={() => newDesign()}>Simple starter</button><button onClick={() => newDesign(true)}>Blank canvas</button><button onClick={() => importer.current?.click()}><Upload size={14} />Import JSON</button><button onClick={() => { setExportStatus(""); setExportOpen(true); }}><Download size={14} />Export JSON</button><button disabled={liveFlow} onClick={exportSvg}><Download size={14} />Export SVG</button></div></details><button className="sd-button primary" onClick={share}><Share2 size={14} />Share</button></div>
    </header>
    <input type="file" ref={importer} hidden accept=".json,application/json" onChange={async e => { const file = e.target.files?.[0]; if (!file) return; try { if (file.size > 100000) throw new Error("File too large. Maximum 100 KB."); commit(parseDesign(JSON.parse(await file.text()))); clearSelection(); setSource(null); setMessage("Design imported."); } catch (err) { setMessage(err instanceof Error ? err.message : "Import failed."); } e.target.value = ""; }} />
    {ready && <ArchitectureSimulationLab design={design} onChange={commit} active={liveFlow} />}
    <div className={`sd-lab-grid ${connectionDraft ? "is-connecting" : ""}`} style={liveFlow ? { display: "none" } : undefined}>
      <button className="sd-library-toggle sd-button" aria-label={libraryOpen ? "Hide components" : "Show components"} aria-expanded={libraryOpen} onClick={() => setLibraryOpen(!libraryOpen)}><PanelsTopLeft size={18} /></button><aside className="sd-panel sd-palette" hidden={!libraryOpen}>
        <div className="sd-library-heading"><span>Components <small>{componentCatalog.length}</small></span><button aria-label="Close component library" onClick={() => setLibraryOpen(false)}><X size={14} /></button></div>
        <input className="sd-library-search" type="search" aria-label="Search components" placeholder="Search components..." value={componentSearch} onChange={e => setComponentSearch(e.target.value)} />
        <p>Drag onto canvas or click to add</p>
        {libraryGroups.map(([category, components]) => <section className="sd-library-group" key={category}><h2>{category}</h2><div className="sd-library-items">{components.map(({ type, keywords }) => <button key={type} title={`Drag ${type} onto the canvas: ${keywords}`} onPointerDown={e => startLibraryDrag(e, type)} onPointerMove={moveLibraryDrag} onPointerUp={e => finishLibraryDrag(e)} onPointerCancel={() => finishLibraryDrag()} onLostPointerCapture={() => { if (libraryDrag.current) finishLibraryDrag(); }} onDragStart={e => e.preventDefault()} onClick={e => { if (e.detail === 0 || !suppressLibraryClick.current) add(type); suppressLibraryClick.current = false; }}><ComponentIcon type={type} className="h-5 w-5" /><span>{type}</span><Plus size={14} /></button>)}</div></section>)}
        {!libraryGroups.length && <p className="sd-library-empty">No components match your search.</p>}
        {(!componentSearch || "data center region boundary".includes(componentSearch.trim().toLowerCase())) && <button onClick={addBoundary}><Network size={18} /><span>Data center</span><Plus size={14} /></button>}
        <div className="sd-small">Drag to place. Pink guides align components; green gaps match spacing. Hold Alt to bypass snapping. Drag to the bin to delete.</div>
      </aside>
      <section className={`sd-canvas-panel ${libraryPreview ? "sd-library-dragging" : ""} ${canDrop ? "sd-drop-ready" : ""}`}>
        {(dragPreview || deletedPreview) && <div ref={trash} className={`sd-drag-trash ${overTrash ? "is-over" : ""} ${deletedPreview ? "is-deleted" : ""}`} role="status" aria-label="Drag component here to delete"><Trash2 size={26} /><span>{deletedPreview ? "Deleted" : overTrash ? "Deleting component..." : "Drag here to delete"}</span></div>}
        {libraryPreview && <svg className={`sd-drag-preview sd-library-preview ${canDrop ? "is-valid" : ""}`} aria-hidden="true" viewBox="0 0 160 100" style={{ left: libraryPreview.x - 80 * libraryPreview.scale, top: libraryPreview.y - 26 * libraryPreview.scale, width: 160 * libraryPreview.scale, height: 100 * libraryPreview.scale }}><ArchitectureNode node={libraryPreview.node} selected /></svg>}
        {connectionDraft && <div className={`sd-wire-hint ${connectionDraft.error ? "is-invalid" : connectionDraft.target ? "is-snapped" : ""}`} role="status">{connectionDraft.error || (connectionDraft.target ? "Release to connect" : "Drag onto a component - Esc to cancel")}</div>}
        {libraryPreview && <div className="sd-drop-hint" role="status">{canDrop ? "Release to add component" : "Drag onto the canvas - Esc to cancel"}</div>}
        {dragPreview && <svg className="sd-drag-preview" aria-hidden="true" viewBox="0 0 160 100" style={{ left: dragPreview.x - 80 * dragPreview.scale, top: dragPreview.y - 45 * dragPreview.scale, width: 160 * dragPreview.scale, height: 100 * dragPreview.scale }}><ArchitectureNode node={dragPreview.node} selected /></svg>}
        {deletedPreview && <svg className="sd-delete-preview" aria-hidden="true" viewBox="0 0 160 100" onAnimationEnd={() => setDeletedPreview(null)} style={{ left: deletedPreview.x - 80 * deletedPreview.scale, top: deletedPreview.y - 45 * deletedPreview.scale, width: 160 * deletedPreview.scale, height: 100 * deletedPreview.scale, "--trash-dx": `${deletedPreview.dx}px`, "--trash-dy": `${deletedPreview.dy}px` } as CSSProperties}><ArchitectureNode node={deletedPreview.node} /></svg>}
        <div className="sd-canvas-toolbar"><input onFocus={beginEdit} onBlur={finishEdit} aria-label="Design title" title={design.title} maxLength={120} value={design.title} onChange={e => commit({ ...design, title: e.target.value })} /><div className="sd-toolbar"><button className={`sd-button ${!connecting && !panMode ? "active" : ""}`} onClick={() => { setConnecting(false); setPanMode(false); setSource(null); }}><MousePointer2 size={15} />Move</button><button className={`sd-button ${connecting ? "active" : ""}`} onClick={() => { setConnecting(true); setPanMode(false); setSource(null); setMessage("Select a source component, then a destination."); }}><Network size={15} />Connect</button><button className={`sd-button ${panMode ? "active" : ""}`} aria-pressed={panMode} onClick={() => { setPanMode(!panMode); setConnecting(false); setSource(null); }}><Hand size={15} />Pan</button><button className="sd-button" aria-label="Undo" title="Undo (Ctrl / Cmd + Z)" disabled={!past.length} onClick={undo}><Undo2 size={15} /></button><button className="sd-button" aria-label="Redo" title="Redo (Ctrl / Cmd + Shift + Z)" disabled={!future.length} onClick={redo}><Redo2 size={15} /></button></div></div>
        <div className="sd-canvas-scroll"><svg ref={svg} tabIndex={-1} className="sd-canvas" viewBox={camera.viewBox} role="group" aria-label="Architecture canvas" onPointerDown={e => { if (e.button === 0) { canvasPointer.current = { x: e.clientX, y: e.clientY }; e.currentTarget.focus(); } camera.startPan(e); }} onPointerMove={moveComponent} onPointerUp={e => { camera.endPan(); if (connectionDrag.current) finishConnection(e); else { if (canvasPointer.current && Math.hypot(e.clientX - canvasPointer.current.x, e.clientY - canvasPointer.current.y) < 4) clearSelection(); finishDrag(); } canvasPointer.current = null; }} onPointerCancel={() => { camera.endPan(); canvasPointer.current = null; finishConnection(); finishDrag(true); }} onLostPointerCapture={() => { if (connectionDrag.current) finishConnection(); }}>
          <defs><pattern id="sd-grid" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="#edf1f7" /></pattern>{Object.entries(flowColors).map(([kind, color]) => <marker key={kind} id={`sd-arrow-${kind}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill={color} /></marker>)}<marker id="sd-wire-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" /></marker></defs><rect width={scene.width} height={scene.height} fill="white" /><rect width={scene.width} height={scene.height} fill={design.canvas ? "white" : "url(#sd-grid)"} />
          {scene.groups?.map(g => <g key={g.id} role="button" tabIndex={0} aria-label={`Edit boundary ${g.label}`} onClick={() => selectGroup(g.id)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectGroup(g.id); } }} style={{ cursor: "pointer" }}><ArchitectureBoundary group={g} /></g>)}
          {routes.map(({ edge, from, to, path, position }) => {
            const color = flowColors[edge.kind || "request"], focused = selectedEdge === edge.id || hoveredEdge === edge.id || selected === edge.from || selected === edge.to;
            const context = !!selected || !!selectedEdge, primary = isOverviewConnection(from, to);
            const opacity = focused ? 1 : context ? .55 : allConnections ? .95 : primary ? .85 : .35;
            return <g key={edge.id}><path className={newConnection === edge.id ? "sd-connection-created" : undefined} pathLength={newConnection === edge.id ? 1 : undefined} onAnimationEnd={() => setNewConnection(null)} d={path} fill="none" stroke={color} strokeWidth={focused ? 2.6 : 1.8} opacity={opacity} strokeDasharray={edge.kind === "event" || edge.kind === "replication" ? "4 5" : undefined} markerEnd={`url(#sd-arrow-${edge.kind || "request"})`} /><path d={path} fill="none" stroke="transparent" strokeWidth="14" role="button" tabIndex={0} aria-label={`Edit connection from ${from.label} to ${to.label}`} onPointerDown={e => e.stopPropagation()} onPointerEnter={() => setHoveredEdge(edge.id)} onPointerLeave={() => setHoveredEdge(null)} onClick={() => selectEdge(edge.id)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectEdge(edge.id); } if (e.key === "Delete") { commit({ ...design, edges: design.edges.filter(x => x.id !== edge.id) }); setSelectedEdge(null); } }}><title>{edge.label || "Select to inspect this connection"}</title></path>{(focused || allConnections || primary) && <ArchitectureEdgeLabel edge={edge} from={from} to={to} position={position} active />}{running && (focused || !context && (allConnections || primary)) && <circle r="3.5" fill={color} opacity={focused ? 1 : .65} stroke="white" strokeWidth="1" className="sd-packet"><animateMotion path={path} dur={`${2 / speed}s`} repeatCount="indefinite" /></circle>}</g>;
          })}
          {connectionDraft && <g data-editor-only="true" className={`sd-wire-preview ${connectionDraft.error ? "is-invalid" : connectionDraft.target ? "is-snapped" : ""}`} pointerEvents="none"><path className="sd-wire-glow" d={draftPath} fill="none" /><path className="sd-wire-line" d={draftPath} fill="none" markerEnd="url(#sd-wire-arrow)" /></g>}
          {scene.nodes.map((n, index) => <g key={n.id} transform={`translate(${n.x},${n.y})`} data-design-node={n.id} className={`sd-editable-node ${selected === n.id || source === n.id ? "is-selected" : ""} ${connectionDraft?.from === n.id ? "is-wire-source" : ""} ${connectionDraft?.target === n.id ? "is-wire-target" : ""}`}>
            {(connectionDraft?.target === n.id || newConnectionTarget === n.id) && <rect data-editor-only="true" className={`sd-wire-target ${connectionDraft?.error ? "is-invalid" : ""} ${newConnectionTarget === n.id ? "is-connected" : ""}`} x="42" y="-8" width="76" height="68" rx="18" pointerEvents="none" />}
            <g role="button" tabIndex={0} aria-label={`${n.label}, ${n.type}. Select or use arrow keys to move.`} style={{ cursor: connecting ? "crosshair" : panMode ? "grab" : "pointer", touchAction: "none", opacity: dragPreview?.node.id === n.id ? .15 : 1 }}
              onDoubleClick={() => camera.focus(n)}
              onPointerDown={e => {
                if (panMode || e.button !== 0) return;
                e.stopPropagation();
                if (connecting) { connect(n.id); return; }
                e.preventDefault(); e.currentTarget.focus(); e.currentTarget.setPointerCapture(e.pointerId); selectNode(n.id);
                const p = position(e.clientX, e.clientY), stored = design.nodes.find(v => v.id === n.id)!;
                drag.current = { id: n.id, dx: p.x - stored.x, dy: p.y - stored.y, startX: e.clientX, startY: e.clientY, before: design, moved: false, overTrash: false, preview: { node: stored, x: e.clientX, y: e.clientY, scale: svg.current?.getScreenCTM()?.a || 1 } };
              }}
              onKeyDown={e => {
                if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); commit({ ...design, nodes: design.nodes.filter(v => v.id !== n.id), edges: design.edges.filter(v => v.from !== n.id && v.to !== n.id) }); clearSelection(); return; }
                if (e.key === "Escape") { finishDrag(true); return; }
                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (connecting) connect(n.id); else selectNode(n.id); }
                const moves: Record<string, [number, number]> = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] };
                if (moves[e.key]) { e.preventDefault(); const [x, y] = moves[e.key]; commit({ ...design, nodes: design.nodes.map(v => v.id === n.id ? { ...v, x: Math.max(0, Math.min(frameWidth - 160, v.x + x)), y: Math.max(0, Math.min(frameHeight - 90, v.y + y)) } : v) }); }
              }}><ArchitectureNode node={n} ordinal={design.canvas ? index + 1 : undefined} selected={selected === n.id || source === n.id} /></g>
            <g data-editor-only="true" className="sd-node-ports">
              {connectionSides.map(side => {
                const [x, y, rotation] = portPositions[side];
                return <g key={side} data-port={side} role="button" tabIndex={0} aria-label={`Connect ${side} from ${n.label}`} className={`sd-node-port ${connectionDraft?.from === n.id && connectionDraft.fromPort === side ? "is-origin" : ""}`} transform={`translate(${x},${y})`} onPointerDown={e => startConnection(e, n, side)} onKeyDown={e => {
                  if (e.key !== "Enter" && e.key !== " ") return;
                  e.preventDefault(); e.stopPropagation(); clearSelection(); setConnecting(true); setPanMode(false); setSource(n.id); setSourcePort(side); setMessage("Choose a destination component, then press Enter to connect.");
                }}><title>{`Drag to connect from the ${side}`}</title><circle r="16" fill="transparent" stroke="none" /><circle className="sd-port-circle" r="10" /><path d="M-4 0H4 M1-3L4 0 1 3" transform={`rotate(${rotation})`} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></g>;
              })}
            </g>
          </g>)}
          <DiagramLayoutGuides guides={layoutGuides} />
        </svg></div>
        <div className="sd-diagram-legend">{Object.entries(flowColors).map(([kind, color]) => <span key={kind}><i style={{ background: color }} />{kind}</span>)}<span>{node || edge ? "Focused connections" : allConnections ? "All connections" : "Overview · secondary paths subdued"}</span></div>
        <div className="sd-canvas-bottom"><button className={`sd-button ${snapEnabled ? "active" : ""}`} aria-label="Snap to components" aria-pressed={snapEnabled} title="Align centers, edges and equal gaps. Hold Alt while dragging to bypass. Measurements are canvas units." onClick={() => { setSnapEnabled(!snapEnabled); setLayoutGuides([]); }}><Magnet size={15} />Snap</button><span>{design.nodes.length} services · {design.edges.length} connections</span><div className="sd-camera-controls" role="group" aria-label="Diagram zoom controls"><button aria-label="Zoom out" onClick={() => camera.zoomBy(.8)} disabled={camera.zoom <= .66}><Minus size={15} /></button><span>{Math.round(camera.zoom * 100)}%</span><button aria-label="Zoom in" onClick={() => camera.zoomBy(1.25)} disabled={camera.zoom >= 3.49}><Plus size={15} /></button><button aria-label="Fit diagram" onClick={camera.fit}><Scan size={15} />Fit</button></div><button className={`sd-button ${allConnections ? "active" : ""}`} aria-pressed={allConnections} onClick={() => { setAllConnections(!allConnections); clearSelection(); }}>{allConnections ? "All connections" : "Overview"}</button><label className="sd-diagram-speed">Speed <select aria-label="Canvas animation speed" value={speed} onChange={e => setSpeed(Number(e.target.value))}><option value={1}>1×</option><option value={2}>2×</option><option value={4}>4×</option></select></label><button className="sd-button primary" disabled={!design.edges.length} onClick={() => setRunning(!running)}>{running ? <Pause size={15} /> : <Play size={15} />}{running ? "Pause flow" : "Animate connections"}</button></div>
      </section>
      <aside className="sd-panel sd-inspector" hidden={!!dragPreview || !!libraryPreview || !!connectionDraft || !node && !edge && !group}><div className="sd-library-heading"><span>Properties</span><button aria-label="Close properties" onClick={clearSelection}><X size={15} /></button></div>
        {!!design.edges.length && <><label htmlFor="connection-picker">Select a connection</label><select id="connection-picker" value={selectedEdge || ""} onChange={e => { if (e.target.value) selectEdge(e.target.value); else clearSelection(); }}><option value="">Choose a request path…</option>{design.edges.map(e => <option key={e.id} value={e.id}>{design.nodes.find(n => n.id === e.from)?.label} → {design.nodes.find(n => n.id === e.to)?.label}</option>)}</select></>}
        {node ? <><div className="sd-inspector-icon"><ComponentIcon type={node.type} /></div><h3>{node.type}</h3><button className="sd-button" onClick={() => camera.focus(scene.nodes.find(n => n.id === node.id)!)}><Scan size={15} />Focus this service</button><label htmlFor="node-label">Display name</label><input onFocus={beginEdit} onBlur={finishEdit} id="node-label" maxLength={80} value={node.label} onChange={e => commit({ ...design, nodes: design.nodes.map(n => n.id === selected ? { ...n, label: e.target.value } : n) })} /><label htmlFor="node-service">Technology / service</label><input onFocus={beginEdit} onBlur={finishEdit} id="node-service" maxLength={60} placeholder="e.g. PostgreSQL, Amazon S3" value={node.service || ""} onChange={e => commit({ ...design, nodes: design.nodes.map(n => n.id === selected ? { ...n, service: e.target.value } : n) })} /><p>{design.edges.filter(e => e.from === node.id).length} outgoing · {design.edges.filter(e => e.to === node.id).length} incoming</p><button className="sd-button danger" onClick={removeNode}><Trash2 size={15} />Delete component</button></> : edge ? <><h3>Connection</h3><p>{design.nodes.find(n => n.id === edge.from)?.label} → {design.nodes.find(n => n.id === edge.to)?.label}</p><label htmlFor="edge-label">Flow label</label><input onFocus={beginEdit} onBlur={finishEdit} id="edge-label" maxLength={60} value={edge.label || ""} placeholder="e.g. Async write" onChange={e => updateEdge({ label: e.target.value })} /><label htmlFor="edge-kind">Flow type</label><select id="edge-kind" value={edge.kind || "request"} onChange={e => updateEdge({ kind: e.target.value as DesignEdge["kind"] })}>{flowKinds.map(k => <option key={k} value={k}>{k}</option>)}</select><button className="sd-button danger" onClick={() => { commit({ ...design, edges: design.edges.filter(e => e.id !== selectedEdge) }); setSelectedEdge(null); }}><Trash2 size={15} />Delete connection</button></> : group ? <><h3>Boundary</h3><label htmlFor="boundary-label">Region / layer name</label><input onFocus={beginEdit} onBlur={finishEdit} id="boundary-label" value={group.label} maxLength={80} onChange={e => updateGroup({ label: e.target.value })} /><label htmlFor="boundary-kind">Boundary type</label><select id="boundary-kind" value={group.kind} onChange={e => updateGroup({ kind: e.target.value as DesignGroup["kind"] })}><option value="region">Region</option><option value="layer">Service layer</option><option value="external">External system</option></select>{(["x", "y", "width", "height"] as const).map(field => <label key={field}>{field}<input onFocus={beginEdit} onBlur={finishEdit} aria-label={`Boundary ${field}`} type="number" value={group[field]} min={field === "width" ? 180 : field === "height" ? 110 : 0} max={field === "x" ? frameWidth - group.width : field === "y" ? frameHeight - group.height : field === "width" ? frameWidth - group.x : frameHeight - group.y} onChange={e => { if (!e.target.value || !Number.isFinite(e.target.valueAsNumber)) return; const min = field === "width" ? 180 : field === "height" ? 110 : 0; const max = field === "x" ? frameWidth - group.width : field === "y" ? frameHeight - group.height : field === "width" ? frameWidth - group.x : frameHeight - group.y; updateGroup({ [field]: Math.max(min, Math.min(max, e.target.valueAsNumber)) }); }} /></label>)}<button className="sd-button danger" onClick={() => { commit({ ...design, groups: design.groups?.filter(g => g.id !== selectedGroup), nodes: design.nodes.map(n => n.groupId === selectedGroup ? { ...n, groupId: undefined } : n) }); clearSelection(); }}><Trash2 size={15} />Delete boundary</button></> : <p>Select a service, arrow, or region to edit it. Use arrow keys to move a focused service.</p>}
        {!!design.groups?.length && <div className="sd-boundary-list"><strong className="sd-section-label">REGIONS & LAYERS</strong>{design.groups.map(g => <button key={g.id} onClick={() => selectGroup(g.id)}>{g.label}</button>)}</div>}
        <div className="sd-inspector-note"><strong>Explore the flow</strong><p>Ctrl / ⌘ + scroll to zoom. Drag empty space to pan. Double-click an icon to focus its connections. Animation illustrates the architecture; timing is not measured latency.</p></div><Link href="/dashboard/playground" className="sd-back">Open code playground <ArrowLeft size={14} /></Link>
      </aside>
    </div>
    <dialog ref={exportDialog} className="sd-export-dialog" aria-labelledby="export-heading" onCancel={() => setExportOpen(false)} onClose={() => setExportOpen(false)}>
      <header><div><h2 id="export-heading">Export your diagram</h2><p>Save this file to reopen or share your design.</p></div><button aria-label="Close export" onClick={() => setExportOpen(false)}><X size={18} /></button></header>
      <label htmlFor="export-json">Diagram JSON</label><textarea ref={exportText} id="export-json" readOnly spellCheck={false} value={exportJson} onFocus={e => e.target.select()} />
      <footer><span role="status">{exportStatus}</span><button className="sd-button" onClick={async () => { try { await navigator.clipboard.writeText(exportJson); setExportStatus("JSON copied to clipboard."); } catch { exportText.current?.focus(); exportText.current?.select(); setExportStatus("Press Ctrl / Cmd + C to copy the selected JSON."); } }}>Copy JSON</button><a id="download-json" className="sd-button primary" href={`data:application/json;charset=utf-8,${encodeURIComponent(exportJson)}`} download="system-design.json"><Download size={14} />Download JSON</a></footer>
    </dialog>
    <p role="status" className="sd-lab-status">{message || "Ctrl / ⌘ + scroll to zoom · drag empty space to pan · double-click a service to focus · select an arrow to reveal its label."}</p>{shareUrl && <div className="sd-share"><button className="sd-share-close" aria-label="Close share link" onClick={() => setShareUrl("")}><X size={16} /></button><label htmlFor="share-url">Share link · contains a snapshot of your design</label><input id="share-url" readOnly value={shareUrl} onFocus={e => e.target.select()} /><p>Changes after sharing require a new link. Share links include your component labels.</p></div>}
  </div>;
}
