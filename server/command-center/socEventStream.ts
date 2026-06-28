import { EventEmitter } from "events";
import type { Response } from "express";
import { normalizeCommandEvent, type SOCCommandEvent } from "./commandCenterNormalizer";

const emitter = new EventEmitter();
const events: SOCCommandEvent[] = [];
const maxEvents = 500;
let lastEmit = 0;

export function publishSOCEvent(event: SOCCommandEvent): void {
  const now = Date.now();
  if (now - lastEmit < 100) return;
  lastEmit = now;
  const normalized = normalizeCommandEvent(event);
  events.push(normalized);
  if (events.length > maxEvents) events.shift();
  emitter.emit("event", normalized);
}

export function listSOCEvents(tenantId: string, limit = 100): SOCCommandEvent[] {
  return events.filter((event) => event.tenantId === tenantId).slice(-limit).reverse();
}

export function attachSSE(res: Response, tenantId: string): void {
  res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" });
  const listener = (event: SOCCommandEvent) => {
    if (event.tenantId === tenantId) res.write("data: " + JSON.stringify(event) + "\n\n");
  };
  emitter.on("event", listener);
  res.on("close", () => emitter.off("event", listener));
}
