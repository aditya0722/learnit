import { Monitor, Network, Server, Database, Layers, ListOrdered, Cpu, Globe, HardDrive, Workflow, Smartphone, Shield, ShieldCheck, KeyRound, Search, Boxes, Cloud, Radio, Clock, Folder, Activity, Mail, Bell, ScrollText, Waypoints, Gauge, Route, DatabaseBackup, ChartColumn, Container, Braces, LockKeyhole, ArchiveX } from "lucide-react";
import type { ComponentType } from "@/lib/system-design";
export const designIcons = {
  Client: Monitor, Browser: Globe, "Mobile app": Smartphone,
  DNS: Waypoints, CDN: Globe, "Load balancer": Network, "API gateway": Route,
  "Reverse proxy": Route, Firewall: Shield, WAF: ShieldCheck, "Rate limiter": Gauge,
  "Auth service": KeyRound, "Service discovery": Search,
  "API server": Server, Microservice: Boxes, "Serverless function": Cloud,
  Container, "WebSocket server": Radio, Worker: Cpu, Scheduler: Clock,
  Cache: Layers, Database, "SQL database": Database, "NoSQL database": Braces,
  "Read replica": DatabaseBackup, "Search index": Search, "Data warehouse": ChartColumn,
  "Object storage": HardDrive, "File storage": Folder, "Block storage": HardDrive,
  Queue: ListOrdered, "Event bus": Workflow, "Message broker": Network,
  "Stream processor": Activity, "Dead letter queue": ArchiveX,
  Logging: ScrollText, Metrics: Gauge, Tracing: Waypoints, "Notification service": Bell,
  "Email service": Mail, "Secrets manager": LockKeyhole,
} satisfies Record<ComponentType, typeof Monitor>;
export function ComponentIcon({ type, className, size }: { type: ComponentType; className?: string; size?: number }) { const Icon = designIcons[type]; return <Icon size={size} className={className || "h-6 w-6"} aria-hidden="true" />; }
