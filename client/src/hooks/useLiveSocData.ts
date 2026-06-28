import { useEffect, useMemo, useState } from "react";

export interface LiveKpi {
  threatScore: number;
  criticalAlerts: number;
  mediumAlerts: number;
  lowAlerts: number;
  iocCount: number;
  domains: number;
  urls: number;
  hashes: number;
  emails: number;
  malware: number;
  pdfReports: number;
}

export interface ApiHealthStatus {
  name: string;
  status: "online" | "degraded" | "offline";
  latency: number;
  uptime: number;
  responseTime: number;
  lastChecked: Date;
}

export interface ThreatMapEvent {
  id: string;
  city: string;
  country: string;
  type: "phishing" | "malware" | "botnet" | "scan";
  severity: "danger" | "warning" | "neutral";
  x: number;
  y: number;
}

const apiNames = ["VirusTotal", "OTX", "AbuseIPDB", "URLScan", "Censys", "Shodan", "GreyNoise"];
const mapSeeds: Omit<ThreatMapEvent, "id">[] = [
  { city: "São Paulo", country: "Brasil", type: "phishing", severity: "danger", x: 34, y: 72 },
  { city: "Ashburn", country: "EUA", type: "scan", severity: "warning", x: 24, y: 36 },
  { city: "Frankfurt", country: "Alemanha", type: "botnet", severity: "danger", x: 51, y: 33 },
  { city: "Singapura", country: "Singapura", type: "malware", severity: "danger", x: 76, y: 58 },
  { city: "Tóquio", country: "Japão", type: "scan", severity: "neutral", x: 85, y: 43 },
  { city: "Londres", country: "Reino Unido", type: "phishing", severity: "warning", x: 47, y: 30 },
];

function jitter(value: number, amount: number, min = 0) {
  return Math.max(min, value + Math.round((Math.random() - 0.5) * amount));
}

function buildApiHealth(): ApiHealthStatus[] {
  return apiNames.map((name, index) => {
    const degraded = name === "Censys" && Math.random() > 0.55;
    const offline = name === "OTX" && Math.random() > 0.86;
    const latency = 150 + index * 24 + Math.round(Math.random() * 95);
    return {
      name,
      status: offline ? "offline" : degraded ? "degraded" : "online",
      latency: offline ? 0 : latency,
      uptime: offline ? 97.2 : degraded ? 98.4 : 99.4 + Math.random() * 0.5,
      responseTime: offline ? 0 : latency + Math.round(Math.random() * 50),
      lastChecked: new Date(),
    };
  });
}

function buildMapEvents(seed: number): ThreatMapEvent[] {
  return mapSeeds.map((event, index) => ({
    ...event,
    id: String(seed) + "-" + String(index),
    x: Math.min(92, Math.max(8, event.x + (Math.random() - 0.5) * 3)),
    y: Math.min(84, Math.max(16, event.y + (Math.random() - 0.5) * 3)),
  }));
}

export function useLiveSocData() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => setTick((value) => value + 1), 5000);
    return () => window.clearInterval(interval);
  }, []);

  return useMemo(() => {
    const kpis: LiveKpi = {
      threatScore: Math.min(99, Math.max(40, jitter(82, 10))),
      criticalAlerts: jitter(18, 6),
      mediumAlerts: jitter(74, 12),
      lowAlerts: jitter(146, 18),
      iocCount: jitter(2341, 42),
      domains: jitter(1248, 24),
      urls: jitter(783, 30),
      hashes: jitter(186, 10),
      emails: jitter(549, 16),
      malware: jitter(86, 8),
      pdfReports: jitter(42, 4),
    };

    return { tick, kpis, apiHealth: buildApiHealth(), mapEvents: buildMapEvents(tick), updatedAt: new Date() };
  }, [tick]);
}
