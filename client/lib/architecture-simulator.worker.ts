import type { Design } from "./system-design";
import { advanceLab, createLabState, randomLabFailure, sendLabRequests, setLabTraffic, toggleLabFailure, type LabState, type TrafficSettings } from "./architecture-simulator";

export type LabCommand =
  | { type: "init"; design: Design; seed: number; speed?: number }
  | { type: "send"; count: number; settings: TrafficSettings }
  | { type: "traffic"; settings: TrafficSettings | null }
  | { type: "play"; running: boolean; speed?: number }
  | { type: "step" }
  | { type: "failure"; target: string; kind: "node" | "link" }
  | { type: "random-failure" }
  | { type: "restore" };
export type LabSnapshot = { state: LabState; running: boolean };

const scope = self as unknown as { postMessage: (message: LabSnapshot | { error: string }) => void; onmessage: ((event: MessageEvent<LabCommand>) => void) | null };
let design: Design | null = null, state: LabState | null = null, running = false, speed = 1, lastTick = performance.now();
function publish() { if (state) scope.postMessage({ state, running }); }
scope.onmessage = ({ data }) => {
  try {
    if (data.type === "init") { design = data.design; state = createLabState(design, data.seed); running = false; speed = data.speed ?? 1; }
    if (!state || !design) return;
    if (data.type === "send") { state = sendLabRequests(state, design, data.count, data.settings); running = true; }
    if (data.type === "traffic") { state = setLabTraffic(state, design, data.settings); if (data.settings) running = true; }
    if (data.type === "play") { running = data.running; if (data.speed !== undefined) speed = Math.max(.1, Math.min(16, data.speed)); }
    if (data.type === "step") { running = false; state = advanceLab(state, design, 100); }
    if (data.type === "failure") state = toggleLabFailure(state, design, data.target, data.kind);
    if (data.type === "random-failure") state = randomLabFailure(state, design);
    if (data.type === "restore") {
      for (const node of design.nodes) if (state.nodes[node.id].down) state = toggleLabFailure(state, design, node.id, "node");
      for (const edge of [...state.brokenLinks]) state = toggleLabFailure(state, design, edge, "link");
    }
    lastTick = performance.now(); publish();
  } catch (error) { running = false; scope.postMessage({ error: error instanceof Error ? error.message : "Simulation failed" }); }
};
setInterval(() => {
  const now = performance.now(), elapsed = Math.min(250, now - lastTick); lastTick = now;
  if (!running || !state || !design) return;
  try {
    state = advanceLab(state, design, elapsed * speed);
    if (!state.traffic && !Object.keys(state.tasks).length) running = false;
    publish();
  } catch (error) { running = false; scope.postMessage({ error: error instanceof Error ? error.message : "Simulation failed" }); }
}, 50);
