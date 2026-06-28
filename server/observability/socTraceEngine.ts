export type SOCTraceStage = "IOC" | "Provider" | "Aggregator" | "Correlation" | "Incident" | "Intelligence" | "Actions" | "CommandCenter";

export interface SOCTraceSpan {
  traceId: string;
  stage: SOCTraceStage;
  startTime: number;
  endTime?: number;
  status: "running" | "ok" | "error";
  error?: string;
}

const traces = new Map<string, SOCTraceSpan[]>();

export class SOCTraceEngine {
  start(traceId: string, stage: SOCTraceStage): SOCTraceSpan {
    const span: SOCTraceSpan = { traceId, stage, startTime: Date.now(), status: "running" };
    traces.set(traceId, [...(traces.get(traceId) ?? []), span]);
    return span;
  }

  end(span: SOCTraceSpan, error?: unknown): SOCTraceSpan {
    span.endTime = Date.now();
    span.status = error ? "error" : "ok";
    if (error) span.error = error instanceof Error ? error.message : String(error);
    return span;
  }

  list(traceId?: string): SOCTraceSpan[] {
    return traceId ? traces.get(traceId) ?? [] : [...traces.values()].flat();
  }
}

export const socTraceEngine = new SOCTraceEngine();
