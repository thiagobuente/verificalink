export type IocType = "ip" | "domain" | "url" | "hash" | "email";
export type Severity = "safe" | "warning" | "danger" | "neutral";

export interface IocRelationship {
  id: string;
  type: IocType;
  value: string;
  relation: string;
  confidence: number;
  source: string;
}

export interface IocTimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  detail: string;
  source: string;
  severity: Severity;
}

export interface IocCorrelationResult {
  query: string;
  type: IocType;
  riskScore: number;
  severity: Severity;
  sources: string[];
  relationships: IocRelationship[];
  relatedIndicators: string[];
  timeline: IocTimelineEvent[];
}
