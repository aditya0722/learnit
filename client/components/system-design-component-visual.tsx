import { ComponentIcon } from "@/components/system-design-icons";
import type { ComponentType } from "@/lib/system-design";

export function QueueTunnel({ phase = "waiting", progress = 0, color = "#c084fc", items }: { phase?: "enqueue" | "waiting" | "dequeue"; progress?: number; color?: string; items?: string[] }) {
  const movement = Math.min(1, Math.max(0, progress / .65));
  return <g aria-hidden="true">
    <rect x="19" y="34" width="121" height="28" rx="3" fill={`${color}12`} stroke={color} strokeWidth="1" />
    <ellipse cx="19" cy="48" rx="7" ry="14" fill="#16263b" stroke={color} />
    <ellipse cx="140" cy="48" rx="7" ry="14" fill="#16263b" stroke={color} />
    {(items ? [...items].reverse().slice(-5) : ["", "", ""]).map((item, i, all) => {
      const x = 116 - (all.length - 1 - i) * 22 + (phase === "dequeue" ? movement * 22 : 0);
      return <g key={i} opacity={phase === "dequeue" && i === all.length - 1 ? 1 - movement : 1}><rect x={x} y="40" width="19" height="16" rx="3" fill={color} opacity={.4 + i * .12} />{item ? <text x={x + 9.5} y="51" fontSize="8" fill="white" textAnchor="middle">{item}</text> : <path d={`M${x + 5} 44 h9 M${x + 5} 48 h9 M${x + 5} 52 h6`} stroke="#e2e8f0" strokeWidth="1" />}</g>;
    })}
    {phase === "enqueue" && <rect x={7 + movement * 18} y="40" width="19" height="16" rx="3" fill={color} opacity={movement < 1 ? 1 : .7} />}
    <path d="M3 48 h8 m-4 -3 4 3 -4 3 M149 48 h9 m-4 -3 4 3 -4 3" fill="none" stroke={color} strokeWidth="1.3" />
  </g>;
}

export function ComponentVisual({ type, label, status, color, phase, progress = 0 }: { type: ComponentType; label: string; status: string; color: string; phase?: "enqueue" | "waiting" | "dequeue"; progress?: number }) {
  return <>
    <text x="80" y="20" textAnchor="middle" fill="#e2e8f0" fontWeight="600" fontSize="10.5" fontFamily="sans-serif">{label}</text>
    {type === "Queue" ? <QueueTunnel color={color} phase={phase} progress={progress} /> : type === "Database" || type === "Object storage" ? <g stroke={color} fill="#172b43"><path d="M58 37 v22 c0 9 44 9 44 0 V37" /><ellipse cx="80" cy="37" rx="22" ry="7" /><path d="M58 49 c0 9 44 9 44 0" fill="none" /><circle cx="112" cy="53" r="3" fill={color} stroke="none" /></g> : type === "Cache" ? <g>{[0, 1, 2, 3].map(i => <g key={i}><rect x={39 + i * 22} y="36" width="18" height="25" rx="4" fill={i === 2 ? `${color}65` : "#172b43"} stroke={color} /><path d={`M${44 + i * 22} 43 h8 M${44 + i * 22} 49 h8`} stroke={color} /></g>)}</g> : type === "Load balancer" ? <g fill="#172b43" stroke={color}><rect x="32" y="39" width="23" height="19" rx="4" /><path d="M55 48 H75 M75 34 V62 M75 34 H98 M75 48 H98 M75 62 H98" fill="none" />{[30, 44, 58].map(y => <rect key={y} x="98" y={y} width="24" height="9" rx="2" />)}</g> : type === "Worker" || type === "API server" ? <g><g transform="translate(32,36)" color={color}><ComponentIcon type={type} className="h-6 w-6" /></g>{[0, 1, 2].map(i => <g key={i}><rect x="70" y={35 + i * 10} width="52" height="5" rx="2" fill="#2b3b52" /><rect x="70" y={35 + i * 10} width={status === "PROCESSING" ? 12 + progress * 36 : 20 + i * 9} height="5" rx="2" fill={color} opacity={.5 + i * .2} /></g>)}</g> : <g transform="translate(65,33)" color={color}><ComponentIcon type={type} className="h-7 w-7" /></g>}
    <text x="80" y="80" textAnchor="middle" fill={color} fontFamily="sans-serif" fontSize="8">{type === "Queue" ? phase === "enqueue" ? "PRODUCER → BUFFER" : phase === "dequeue" ? "BUFFER → CONSUMER" : "MESSAGES WAIT HERE" : status}</text>
  </>;
}
